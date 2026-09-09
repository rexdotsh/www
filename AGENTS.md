# AGENTS.md

Personal site + blog for **rex** / **mridul** (same person; name switches on hostname, see `src/lib/content.ts:getIdentity`). Live at rex.wf and mridul.sh.

Homepage is one interactive "sentence" with peek cards and a particle rose (`src/routes/index.tsx`, `src/components/the-sentence.tsx`). Plus a Spotify widget, a GitHub heatmap, and an MDX blog (`src/content/*.mdx`).

## Stack

TanStack Start + Router (file-based routes in `src/routes/`), React 19, Vite 8, Tailwind v4 + plain CSS, MDX, deployed to Cloudflare Workers via Nitro + Wrangler. **Bun** for everything. Biome via `ultracite` for lint/format (lefthook runs it pre-commit).

No database, no auth, no user accounts, no tests, no UI library — everything is bespoke. Analytics is self-hosted Umami, injected in `src/routes/__root.tsx`. Only storage is the `SPOTIFY_TOKENS` KV binding.

## Commands

```bash
bun run dev        # localhost:3000
bun run lint       # biome
bun run typecheck  # tsc --noEmit
bun run build
```

Run lint + typecheck before committing. Spotify routes need `.dev.vars` (copy the example).

## Git

Branch from `origin/main`, lowercase conventional commits (`feat:`, `fix:`, `perf:`, `chore:`), PRs via `gh`.

### Screenshots in PRs

Attach screenshots for any visual change with `gh --attach` (needs gh ≥ 2.88). It uploads the file to GitHub and inlines the URL, so images render in the PR body. Works on `gh pr create`, `gh pr edit`, and `gh pr comment`; repeat the flag for multiple files, and add alt text after a `#`.

```bash
# append images to the end of the body
gh pr create --title "feat: thing" --body-file body.md --attach 'shots/light.png#light mode' --attach 'shots/dark.png#dark mode'

# or reference local paths in the markdown and gh rewrites them in place
#   body.md:  | ![light](shots/light.png) | ![dark](shots/dark.png) |
gh pr edit 27 --body-file body.md --attach shots/light.png --attach shots/dark.png

# add more later
gh pr comment 27 --body "mobile:" --attach shots/mobile.png
```

Take the screenshots headless with `dev-browser --headless` (Playwright page API; `saveScreenshot(await page.screenshot({ fullPage: true }), "name.png")` writes to `~/.dev-browser/tmp/`). Capture light, dark (`document.documentElement.dataset.theme = "dark"`), and a 390px-wide mobile viewport.
