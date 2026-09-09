# AGENTS.md

Personal site + blog for **rex** / **mridul** (same person; name switches on hostname,
see `src/lib/content.ts:getIdentity`). Live at rex.wf and mridul.sh.

Homepage is one interactive "sentence" with peek cards and a particle rose
(`src/routes/index.tsx`, `src/components/the-sentence.tsx`). Plus a Spotify widget,
a GitHub heatmap, and an MDX blog (`src/content/*.mdx`).

## Stack

TanStack Start + Router (file-based routes in `src/routes/`), React 19, Vite 8,
Tailwind v4 + plain CSS, MDX, deployed to Cloudflare Workers via Nitro + Wrangler.
**Bun** for everything. Biome via `ultracite` for lint/format (lefthook runs it pre-commit).

No database, no auth, no user accounts, no tests, no UI library — everything is bespoke.
Analytics is self-hosted Umami, injected in `src/routes/__root.tsx`.
Only storage is the `SPOTIFY_TOKENS` KV binding.

## Commands

```bash
bun run dev        # localhost:3000
bun run lint       # biome
bun run typecheck  # tsc --noEmit
bun run build
```

Run lint + typecheck before committing. Spotify routes need `.dev.vars` (copy the example).

## Conventions

- **Voice:** all lowercase. Mono italic captions in `( parens )`. Serif headings with a rose
  full stop: `title<span className="full-stop text-rose">.</span>`.
- **Page shell:** copy `src/routes/blog/index.tsx` — `paper` main, `max-w-xl`, `BackLink`,
  staggered `rise` entrances via `animationDelay`.
- **Tokens:** `text-ink / text-muted / text-faint / text-rose / bg-paper / bg-card`,
  heatmap scale `--heat-0..4`. Rose is the only accent.
- **Fonts:** `font-mono` for UI, `font-serif-display` for headings, `font-serif-body` for
  prose (not global — load `fonts-body.css` in the route `head()`).
- **Route-specific CSS:** `import fooCss from "../foo.css?url"` → `{ rel: "stylesheet", href }` in `head()`.
- **Charts:** no library; hand-roll SVG/CSS. Precedent: `Heatmap` in `the-sentence.tsx`.
- **Lint gotchas:** no `i++` (use `+= 1`), no bitwise ops, no `console.log`.
- **Generated, don't edit:** `src/routeTree.gen.ts`, `worker-configuration.d.ts`,
  `src/fonts/*.woff2`, `public/og/*.png`.

## Adding a post

`src/content/<slug>.mdx` → meta in `src/lib/posts-meta.ts` → register in `CONTENT` in
`src/lib/posts.ts` → `bun run og:gen`. Sitemap/RSS pick it up automatically.

## Git

Branch from `origin/main`, lowercase conventional commits (`feat:`, `fix:`, `perf:`, `chore:`),
PRs via `gh`; attach screenshots for visual changes.
