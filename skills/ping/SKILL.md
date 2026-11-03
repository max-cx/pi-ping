---
name: ping
description: Explain, configure, or troubleshoot pi-ping, the audible notification that plays a bundled radar ping when Pi finishes a run and waits for input. Use when the user wants a sound/beep/alarm on task completion, asks why the ping does not play, wants a different completion sound, or wants the ping disabled or removed.
---

# pi-ping

`pi-ping` is a Pi package that plays a short bundled sound — a radar ping from
`assets/ping.flac` — on `agent_settled`, the final Pi lifecycle boundary. The
ping therefore means "your turn", not "one step finished": retries,
auto-compaction, and queued follow-ups have all finished when it plays. Aborted
runs (Escape) are silent by default.

This skill documents the extension in `extensions/ping.ts`; it cannot play the
sound itself.

## Install

```bash
pi install git:github.com/max-cx/pi-ping           # from git
pi install git:github.com/max-cx/pi-ping@v1.1.1    # from git, pinned to a release
pi install ./pi-ping                               # from a local checkout
pi install npm:pi-ping@1.1.1                       # from npm, once published
```

Add `--local` (`-l`) to configure it per project. To try it without changing
settings:

```bash
pi -e ~/pi-ping
```

Then `/reload` and run `/ping` to hear the bundled sound.

## Configure

The ping works with no configuration; the bundled file is used by default.

| Variable | Default | Effect |
|---|---|---|
| `PI_PING` | unset | `0`/`false`/`off` disables the ping without uninstalling |
| `PI_PING_SOUND_CMD` | unset | Shell command used instead of the built-in players |
| `PI_PING_SOUND_FILE` | bundled `assets/ping.flac` | Play another audio file |
| `PI_PING_ON_ABORT` | unset | `1` also pings when a run is aborted (Escape) |
| `PI_PING_MIN_DURATION_MS` | `0` | Skip the ping for runs shorter than this many milliseconds |

Examples:

```bash
# Only ping for runs longer than 20 seconds
export PI_PING_MIN_DURATION_MS=20000

# Use a different sound, or bypass the player detection entirely
export PI_PING_SOUND_FILE=/usr/share/sounds/freedesktop/stereo/complete.oga
export PI_PING_SOUND_CMD='paplay /path/to/other.oga'
```

Export these from the shell profile that launches Pi; the extension reads them
at load time, so restart Pi after changing them.

## How the sound is played

The bundled FLAC is decoded by the first working player:

1. `PI_PING_SOUND_CMD`, if set.
2. macOS: `afplay`.
3. Linux/BSD: `paplay`, `pw-play`, `ffplay`, `play`; `aplay` only for `.wav`,
   because it plays raw PCM and would treat a FLAC bitstream as noise.
4. Terminal bell (`\x07`) if nothing above can play the file.

Playback is detached and non-blocking. A player that cannot start, or that
starts and exits non-zero, falls through to the next candidate, so a broken
audio stack degrades to the visible bell instead of delaying Pi.

## Troubleshooting

- No sound at all: confirm the package is installed (`pi list`) and Pi is not
  running with `--no-extensions`. Run `/ping` to test independently of the
  completion event.
- Visible bell (`^G`) instead of the ping: no working audio player was found —
  check `paplay`/`pw-play` on your `PATH`, or set `PI_PING_SOUND_CMD`.
- Ping only sometimes: `PI_PING_MIN_DURATION_MS` is set, or the run was aborted
  and `PI_PING_ON_ABORT` is unset.
- Two sounds per run: another completion notifier is active; remove the
  duplicate extension or package.
- Nothing over SSH/tmux: expected — the audio device is on the machine running
  Pi. Use the terminal bell there, or a remote-friendly `PI_PING_SOUND_CMD`.

## Remove

```bash
pi remove git:github.com/max-cx/pi-ping
```

then `/reload`. To keep it installed but silent, set `PI_PING=0`.
