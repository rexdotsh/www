# Astro migration benchmark

Compared the TanStack Start implementation at `f743add` with the Astro implementation in this branch on September 8, 2026.

## Method

- Both versions were built with Bun on the same machine and Node/Bun versions.
- The baseline was built from a clean detached worktree at `f743add`.
- The Astro version used `astro build` with the Cloudflare adapter and server output.
- Route payloads were measured from local preview servers after a warm-up request.
- “Referenced assets” includes assets in the HTML plus assets referenced by its CSS, including fonts.
- Gzip values use maximum compression for a stable approximation of transfer size. Actual CDN transfer depends on response compression and caching.
- Build timings are three consecutive local builds after dependency installation, not a CI benchmark.

## Results

### Client assets referenced by each route

| Route | Baseline raw | Astro raw | Change | Baseline gzip | Astro gzip | Change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 664 KB | 529 KB | **-20.4%** | 392 KB | 343 KB | **-12.6%** |
| `/blog` | 876 KB | 502 KB | **-42.7%** | 609 KB | 333 KB | **-45.3%** |
| `/blog/parabox` | 942 KB | 571 KB | **-39.4%** | 621 KB | 345 KB | **-44.4%** |

The blog improvement is the most meaningful: Astro emits HTML directly and only hydrates the interactive `CornerNotes` island. The post keeps its interactive reading controls in a dedicated React island instead of shipping the application router to every page.

### Build output

| Metric | Baseline | Astro | Change |
| --- | ---: | ---: | ---: |
| Client JS, raw | 432 KB | 299 KB | **-30.8%** |
| Client JS, gzip | 128 KB | 85 KB | **-33.9%** |
| All client assets, raw | 1,139 KB | 1,003 KB | **-11.9%** |
| All client assets, gzip | 777 KB | 732 KB | **-5.8%** |
| Server output, raw | 1,156 KB | 1,353 KB | +17.0% |
| Server output, gzip | 240 KB | 298 KB | +24.0% |

The all-assets reduction is smaller than the JavaScript reduction because both versions ship the same font families. The Astro server output is larger because it includes the Astro/Cloudflare runtime and route manifest.

### Local build and dependency footprint

| Metric | Baseline | Astro | Change |
| --- | ---: | ---: | ---: |
| Build time, 3-run average | 8.50 s | 11.13 s | +31.0% |
| Direct production dependencies | 9 | 10 | +1 |
| Direct dev dependencies | 23 | 21 | -2 |
| Installed `node_modules` file bytes | 981 MB | 1,631 MB | +66.3% |

The installed dependency size is a local filesystem measure and includes transitive packages. It is primarily the cost of Astro, the Cloudflare adapter, and their tooling; it does not represent browser payload size.

### Local response timing

Median response time over 10 warmed requests, excluding the first two, from local Cloudflare preview servers:

| Route | Baseline | Astro | Change |
| --- | ---: | ---: | ---: |
| `/` | 10.79 ms | 10.54 ms | -2.3% |
| `/blog` | 7.86 ms | 6.35 ms | -19.2% |
| `/blog/parabox` | 13.08 ms | 12.83 ms | -1.9% |

These timings are too close to treat as production latency improvements. The dependable result is reduced browser JavaScript, especially on content routes.

## Takeaway

Astro is a net win for this site because most pages are content-first and only a few surfaces need React. It removes the client router and React application shell from the ordinary blog route, reducing route-level transfer size by roughly 45% gzip. The cost is a larger server/runtime dependency footprint and slower local builds. Production Web Vitals should be re-measured after deployment with real CDN and browser data.
