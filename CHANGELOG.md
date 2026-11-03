# Changelog

## [1.1.1]

- Credit the sound properly: the download page
  <https://freesound.org/people/unfa/sounds/584179/> is recorded in
  `CREDITS.md`, together with its SHA-256 and format details.
- Include the CC0 1.0 Universal legal code as `LICENSES/CC0-1.0.txt`, and ship
  `LICENSES/` in the package, so the sound's license travels with it.
- Install instructions track the default branch by default and pin a release tag
  explicitly, instead of hardcoding one tag in every command.

## [1.1.0]

- Bundled the completion sound in the package: `assets/ping.flac` (radar ping,
  1.42 s) is now the default and needs no sound theme or external file. Aborts
  reuse the same sound when `PI_PING_ON_ABORT=1`.
- A player that exits non-zero now falls through to the next candidate instead
  of failing silently, and `aplay` is limited to `.wav` files so it cannot play
  a FLAC bitstream as raw noise.

## [1.0.0]

- Audible completion ping that rings on `agent_settled` once Pi is done and
  waiting for input.
- Player fallback chain ending in the terminal bell.
- Environment configuration and a test command.
