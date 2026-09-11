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

## Spotify auth

Refresh tokens expire 6 months after authorization (Spotify policy since mid-2026). Reconnect by visiting `/api/spotify/connect?key=$SPOTIFY_CONNECT_SECRET`; the new token is stored in KV (`spotify:refresh`), no redeploy. `src/lib/spotify-auth.ts` sends a Telegram DM (`TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`) with that link ~30 days before expiry and again on `invalid_grant`. The redirect URI `<origin>/api/spotify/callback` must be registered in the Spotify dashboard for each domain (use `http://127.0.0.1:3000` locally, Spotify rejects `localhost`).

## Git

Lowercase conventional commits (`feat:`, `fix:`, `perf:`, `chore:`), PRs via `gh`. For visual changes can attach screenshots with `gh pr create|edit|comment --attach 'shot.png#alt text'` (repeatable; if the body markdown already references the local path, gh rewrites it in place). Not mandatory.
