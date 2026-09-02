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
    <main className="min-h-dvh bg-paper px-7 py-14 font-serif-display text-ink selection:bg-rose selection:text-paper md:py-24">
      <div className="mx-auto w-full max-w-xl">
        <BackLink className="rise font-mono text-muted text-xs" to="/">
          home
        </BackLink>

        <h1
          className="rise mt-10 text-[clamp(2.4rem,7vw,3.2rem)] leading-none"
          style={{ animationDelay: "80ms" }}
        >
          writing<span className="full-stop text-rose">.</span>
        </h1>
        <p
          className="rise mt-3 font-mono text-faint text-[11px] italic"
          style={{ animationDelay: "150ms" }}
        >
          ( occasionally, about things worth the words )
        </p>

        <ul className="post-list mt-14">
          {PUBLISHED_META.map((post, index) => (
            <li
              className="rise"
              key={post.slug}
              style={{ animationDelay: `${230 + index * 70}ms` }}
            >
              <Link
                className="group block py-4"
                params={{ slug: post.slug }}
                to="/blog/$slug"
              >
                <span className="block font-mono text-faint text-[11px] tabular-nums transition-colors duration-200 group-hover:text-muted">
                  {post.dateLabel}
                </span>
                <span
                  className="mt-1 block text-[clamp(1.4rem,4.5vw,1.8rem)] leading-tight transition-colors duration-200 group-hover:text-rose"
                  style={{ viewTransitionName: `post-${post.slug}` }}
                >
                  {post.title}
                  <span
                    aria-hidden="true"
                    className="ml-2 inline-block text-rose transition-transform duration-200 ease-strong group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
                <span className="mt-1.5 block font-serif-body text-muted text-[15px] italic">
                  {post.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <footer
          className="rise mt-16 border-ink/10 border-t pt-6"
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
        </footer>
      </div>
    </main>
  );
}
