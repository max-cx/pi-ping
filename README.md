# pi-ping

An audible completion ping for [Pi](https://pi.dev): a short radar ping when the
agent settles and waits for your input, so you can look away during long runs.

The sound ships inside the package (`assets/ping.flac`), so no sound theme, no
external file, and no configuration are needed.

The ping fires on `agent_settled`, the final lifecycle boundary — after retries,
auto-compaction, and queued follow-ups have finished. It is not a per-turn beep.
Aborted runs (Escape) are silent by default.

## Install

```bash
pi install git:github.com/max-cx/pi-ping           # tracks the default branch
pi install git:github.com/max-cx/pi-ping@v1.1.1    # pinned to a release tag
pi install ./pi-ping                               # local checkout
pi install npm:pi-ping@1.1.1                       # once published to npm
```

Add `--local` (`-l`) to configure it per project instead of globally. Try it for
a single session without touching settings:

```bash
pi -e ~/pi-ping
```

Then `/reload` and `/ping`.

## What it ships

```text
pi-ping/
├── package.json
├── extensions/ping.ts            # agent_settled hook + /ping command
├── skills/ping/SKILL.md          # configuration and troubleshooting guide
├── assets/ping.flac              # the bundled ping (1.4 s, 48 kHz stereo)
├── CREDITS.md                    # sound attribution and license
├── LICENSES/CC0-1.0.txt          # license text for the bundled sound
└── CHANGELOG.md
```

Pi loads both resources from the package; there is nothing to copy into
`~/.pi/agent`.

## How the sound is played

The FLAC is decoded by the first working player:

| Platform | Order |
|---|---|
| macOS | `afplay` |
| Linux/BSD | `paplay`, `pw-play`, `ffplay`, `play` (then `aplay`, WAV only) |
| Any, no audio | terminal bell (`\x07`) |

Playback is detached and non-blocking. A player that cannot start, or that exits
non-zero, falls through to the next candidate, so a broken audio setup degrades
to the visible bell instead of delaying Pi or failing silently.

## Configuration

| Variable | Default | Effect |
|---|---|---|
| `PI_PING` | unset | `0`/`false`/`off` disables the ping |
| `PI_PING_SOUND_CMD` | unset | Custom shell command that plays the sound |
| `PI_PING_SOUND_FILE` | bundled `assets/ping.flac` | Play a different audio file |
| `PI_PING_ON_ABORT` | unset | `1` also pings when a run is aborted |
| `PI_PING_MIN_DURATION_MS` | `0` | Skip runs shorter than this many milliseconds |

```bash
export PI_PING_MIN_DURATION_MS=20000
```

Set these in the shell profile that launches Pi, then restart Pi.

## Develop

```bash
pi -e ~/pi-ping     # load the working tree for one session
/ping               # ring on demand
```

The extension imports only the host's `ExtensionAPI` type plus Node built-ins,
and declares `@earendil-works/pi-coding-agent` as a `peerDependency` (never a
`dependency`) so Pi keeps a single copy of its classes.

## License

The code is MIT — see [LICENSE](LICENSE). The bundled sound `assets/ping.flac` is
dedicated to the public domain under CC0 1.0 Universal; the full legal code is
included as [LICENSES/CC0-1.0.txt](LICENSES/CC0-1.0.txt), and the source URL plus
attribution are in [CREDITS.md](CREDITS.md).
