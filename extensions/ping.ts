/**
 * pi-ping — audible completion ping for Pi.
 *
 * Plays a short bundled sound when the agent settles, that is when Pi will not
 * continue on its own and is waiting for input. Aborts are silent by default.
 *
 * The sound is `assets/ping.flac`, shipped inside this package; no external
 * file or sound theme is required. See the `ping` skill for the full guide.
 *
 * Environment:
 *   PI_PING=0                    disable the ping without uninstalling
 *   PI_PING_SOUND_CMD="..."      custom shell command that plays the sound
 *   PI_PING_SOUND_FILE=/path     play another audio file instead of the bundled one
 *   PI_PING_ON_ABORT=1           also ping when a run is aborted
 *   PI_PING_MIN_DURATION_MS=n    skip runs shorter than n milliseconds
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Player = { command: string; args: string[] };

/** The bundled ping, resolved relative to this extension file. */
function bundledSound(): string | undefined {
	try {
		return fileURLToPath(new URL("../assets/ping.flac", import.meta.url));
	} catch {
		return undefined;
	}
}

const BUNDLED_SOUND = bundledSound();

function envTruthy(value: string | undefined): boolean {
	if (!value) return false;
	return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function hasCommand(name: string): boolean {
	const dirs = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
	return dirs.some((dir) => existsSync(join(dir, name)));
}

/** Ring the terminal bell; works with no audio stack at all. */
function ringBell(): void {
	process.stdout.write("\x07");
}

/**
 * Players that can decode the file, most preferred first. `aplay` is only used
 * for WAV because it plays raw PCM: it would treat a FLAC bitstream as noise.
 */
function filePlayers(file: string): Player[] {
	const players: Player[] = [];
	if (process.platform === "darwin" && hasCommand("afplay")) {
		players.push({ command: "afplay", args: [file] });
	}
	if (hasCommand("paplay")) players.push({ command: "paplay", args: [file] });
	if (hasCommand("pw-play")) players.push({ command: "pw-play", args: [file] });
	if (hasCommand("ffplay")) {
		players.push({ command: "ffplay", args: ["-nostdin", "-nodisp", "-autoexit", "-loglevel", "quiet", file] });
	}
	if (hasCommand("play")) players.push({ command: "play", args: ["-q", file] });
	if (/\.wav$/i.test(file)) {
		if (hasCommand("aplay")) players.push({ command: "aplay", args: ["-q", file] });
	}
	return players;
}

function candidates(): Player[] {
	const custom = process.env.PI_PING_SOUND_CMD?.trim();
	if (custom) return [{ command: "/bin/sh", args: ["-c", custom] }];

	const file = process.env.PI_PING_SOUND_FILE?.trim() || BUNDLED_SOUND;
	return file && existsSync(file) ? filePlayers(file) : [];
}

/**
 * Try each candidate in turn. A command that cannot start emits `error`, and a
 * player that starts but cannot decode exits non-zero; both fall through to the
 * next candidate, ending with the terminal bell.
 */
function play(candidates: Player[], index = 0): void {
	const player = candidates[index];
	if (!player) {
		ringBell();
		return;
	}
	try {
		const child = spawn(player.command, player.args, { detached: true, stdio: "ignore" });
		child.on("error", () => play(candidates, index + 1));
		child.on("exit", (code) => {
			if (code !== 0) play(candidates, index + 1);
		});
		child.unref();
	} catch {
		play(candidates, index + 1);
	}
}

export default function (pi: ExtensionAPI) {
	const disabled = ["0", "false", "no", "off"].includes((process.env.PI_PING ?? "").trim().toLowerCase());
	const pingOnAbort = envTruthy(process.env.PI_PING_ON_ABORT);
	const minDuration = Number.parseInt(process.env.PI_PING_MIN_DURATION_MS ?? "", 10) || 0;

	let startedAt = 0;

	pi.on("agent_start", async () => {
		startedAt = Date.now();
	});

	// `agent_settled` is the final, notification-only boundary: no retries,
	// compaction, or queued follow-ups are pending after it fires.
	pi.on("agent_settled", async (event) => {
		if (disabled) return;
		if (event.aborted && !pingOnAbort) return;
		if (minDuration > 0 && startedAt > 0 && Date.now() - startedAt < minDuration) return;
		play(candidates());
	});

	pi.registerCommand("ping", {
		description: "Play the pi-ping completion sound",
		handler: async (_args, ctx) => {
			if (disabled) {
				ctx.ui.notify("pi-ping is disabled (PI_PING)", "warning");
				return;
			}
			play(candidates());
			ctx.ui.notify("Played the pi-ping sound", "info");
		},
	});
}
