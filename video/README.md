# video

Renders the homepage demo video (the one for twitter). Self-contained; nothing in `src/` changes — all data is mocked via request interception.

```bash
bun run build && bun run preview -- --port 4173   # from the repo root, in another shell
cd video && bun install && bun run all             # capture → sfx → frame → finish
```

Output lands in `out/site.mp4` (1920×1080, 60fps, AAC, ~17s). `out/` is gitignored.

## Pieces

- `capture.ts` — Xvfb + kiosk Chromium via `playwright-core`, scripted cursor, x11grab. Runs the page at ¼ speed (JS clock + CDP animation timeline) so software-rendered Chromium has time to paint every frame; `finish.ts` speeds it back up. Logs when the site would have played a sound.
- `sfx-render.ts` — renders `src/lib/sfx.ts` through an `OfflineAudioContext` to WAVs.
- `frame.ts` — gradient backdrop + rounded mask. `BG=n` picks a variant, `--gallery` writes a comparison page.
- `finish.ts` — trim, speed-up, frame, mix sfx at the logged timestamps, encode for X.
- `covers.ts` — contact sheet of the rose dressed as different album covers.
- `mock/` — now-playing, cover art, contributions, silent preview mp3.

## Knobs

`IDENTITY=rex|mridul` · `SLOW=4` · `FPS=30` (real capture rate) · `BG=9` · `TRIM_END=0.8` · `SFX_GAIN=1.5` · `FRAME=0` for the bare capture.

Needs `Xvfb`, `ffmpeg`, and the Playwright Chromium build at `~/.cache/ms-playwright/chromium-1234` (or `CHROME=/path/to/chrome`).
