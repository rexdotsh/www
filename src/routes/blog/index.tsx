import { createFileRoute, Link } from "@tanstack/react-router";
import newsreaderItalicWoff2 from "@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2?url";
import BackLink from "@/components/back-link";
import { LINKS } from "@/lib/content";
import { preloadFont, RSS_LINK } from "@/lib/head";
import { PUBLISHED_META } from "@/lib/posts-meta";

const DESCRIPTION = "occasional writeups and notes.";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title: "writing" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "writing" },
      { property: "og:description", content: DESCRIPTION },
    ],
    links: [RSS_LINK, preloadFont(newsreaderItalicWoff2)],
  }),
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control":
      "public, max-age=3600, stale-while-revalidate=86400",
  }),
});

function BlogIndex() {
  return (
    <main className="writing-page min-h-dvh paper px-7 py-14 font-serif-display text-ink selection:bg-rose selection:text-paper md:py-24">
      <div className="mx-auto w-full max-w-3xl">
        <BackLink className="rise font-mono text-muted text-xs" to="/">
          home
        </BackLink>

        <div className="writing-heading">
          <p className="eyebrow rise">the notebook / occasional entries</p>
          <h1 className="rise" style={{ animationDelay: "80ms" }}>
            Notes in
            <br />
            the <em>margin.</em>
          </h1>
          <p
            className="rise writing-description"
            style={{ animationDelay: "150ms" }}
          >
            Things built, puzzles taken apart, and what I learned along the way.
          </p>
          <span aria-hidden="true" className="writing-mark">
            *
          </span>
        </div>

        <div className="writing-index-label eyebrow">
          <span>the entries</span>
          <span>
            {String(PUBLISHED_META.length).padStart(2, "0")} filed / more
            eventually
          </span>
        </div>
        <ul className="post-list writing-list">
          {PUBLISHED_META.map((post, index) => (
            <li
              className="rise"
              key={post.slug}
              style={{ animationDelay: `${230 + index * 70}ms` }}
            >
              <Link
                className="group block py-7"
                params={{ slug: post.slug }}
                to="/blog/$slug"
              >
                <time
                  dateTime={post.date}
                  className="block font-mono text-muted text-[10px] tabular-nums transition-colors duration-200 group-hover:text-rose"
                >
                  {post.dateLabel}
                </time>
                <span
                  className="mt-3 flex items-baseline justify-between gap-3 text-[clamp(1.8rem,4.5vw,2.5rem)] leading-tight transition-colors duration-200 group-hover:text-rose"
                  style={{ viewTransitionName: `post-${post.slug}` }}
                >
                  <span>{post.title}</span>
                  <span
                    aria-hidden="true"
                    className="inline-block shrink-0 text-rose transition-transform duration-200 ease-strong group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
                <span className="mt-2 block font-serif-body text-muted text-[18px] italic">
                  {post.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <footer
          className="rise writing-footer"
          style={{ animationDelay: "360ms" }}
        >
          <a
            className="font-mono text-faint text-[11px] transition-colors duration-150 hover:text-rose"
            href={LINKS.archive}
            rel="noopener noreferrer"
            target="_blank"
          >
            older ctf writeups live on github →
          </a>
          <a className="text-link" href="/blog/rss.xml">
            subscribe via rss <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </div>
    </main>
  );
}
