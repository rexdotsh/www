# AGENTS.md

Personal site + blog for **rex** / **mridul** (same person; name switches on hostname, see `src/lib/content.ts:getIdentity`). Live at rex.wf and mridul.sh.

Homepage is one interactive "sentence" with peek cards and a particle rose (`src/routes/index.tsx`, `src/components/the-sentence.tsx`). Plus a Spotify widget, a GitHub heatmap, and an MDX blog (`src/content/*.mdx`).

## Stack

TanStack Start + Router (file-based routes in `src/routes/`), React 19, Vite 8, Tailwind v4 + plain CSS, MDX, deployed to Cloudflare Workers via Nitro + Wrangler. **Bun** for everything. Biome via `ultracite` for lint/format (lefthook runs it pre-commit).

No database, no auth, no user accounts, no tests, no UI library — everything is bespoke. Analytics is self-hosted Umami, injected in `src/routes/__root.tsx`. Storage is the `SPOTIFY_TOKENS` KV binding and two Durable Objects in `workers/room`: `Room` (visitor stats + guestbook, `src/server/room.ts`) and `FleetStore` (`/status` samples, `src/server/fleet.ts`). The DOs live in their own worker because Cloudflare won't issue preview URLs to a worker that implements one.

**Deploys:** `www` deploys itself via Workers Builds on every push to `main` (PRs get preview builds). Never run `bun run deploy` by hand. The DO worker is not on Workers Builds — after changing anything under `workers/room`, a DO class, or `src/lib/fleet.ts` (the DO bundles its own copy: `HOSTS` roles/specs, the `SERVICES` whitelist, thresholds), run `bun run deploy:room` yourself, and do it *before* merging if `www` binds to a new class.

`/status` ("the workshop") shows the four servers. The per-box sampler is `rexdotsh/fleet-agent`, checked out as the `agent/` submodule (`git submodule update --init`). Shapes and the service whitelist live in `src/lib/fleet.ts`.

## Commands

```bash
bun run dev        # localhost:3000
bun run lint       # biome
bun run typecheck  # tsc --noEmit
bun run build
```

Run lint + typecheck before committing. Spotify routes need `.dev.vars` (copy the example).

## Code

Simple and terse. No duplication, no defensive verbosity, no abstractions for one caller. Comments are almost never needed: write one only when the code can't say it — a why, a constraint, a browser gotcha. Never narrate what the code does. Copy on the site is lowercase and plain; no winks.

## Spotify auth

Spotify refresh tokens expire 6 months after authorization. `src/lib/spotify-auth.ts` handles it: visit `/api/spotify/connect?key=$SPOTIFY_CONNECT_SECRET` to reconnect (token lands in KV, no redeploy), and a Telegram DM with that link fires ~30 days before expiry and on `invalid_grant`. `<origin>/api/spotify/callback` must be a registered redirect URI in the Spotify dashboard (`http://127.0.0.1:3000` locally; Spotify rejects `localhost`).

## Git

Lowercase conventional commits (`feat:`, `fix:`, `perf:`, `chore:`), PRs via `gh`. For visual changes can attach screenshots with `gh pr create|edit|comment --attach 'shot.png#alt text'` (repeatable; if the body markdown already references the local path, gh rewrites it in place). Not mandatory.
