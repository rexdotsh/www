import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import newsreaderItalicWoff2 from "@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2?url";
import newsreaderWoff2 from "@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2?url";
import { PostBody } from "@/components/post-body";
import { getPost, type TocEntry } from "@/lib/posts";
import { getPostMeta } from "@/lib/posts-meta";

const DEFAULT_BASE_URL = "https://rex.wf";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  notFoundComponent: BlogNotFound,
  loader: ({ params }) => {
    // meta only; the compiled post body stays in the component chunk
    const post = getPostMeta(params.slug);
    if (!post) {
      throw notFound();
    }
    return {
      date: post.date,
      description: post.description,
      slug: post.slug,
      title: post.title,
    };
  },
  head: ({ loaderData, matches }) => {
    if (!loaderData) {
      return { meta: [{ title: "writing" }] };
    }
    // the root match is always first and carries the resolved site info
    const baseUrl =
      (matches[0]?.loaderData as { baseUrl?: string } | undefined)?.baseUrl ??
      DEFAULT_BASE_URL;
    const url = `${baseUrl}/blog/${loaderData.slug}`;
    const imageUrl = `${baseUrl}/og/${loaderData.slug}.png`;
    return {
      meta: [
        { title: loaderData.title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: imageUrl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: loaderData.title },
        { property: "article:published_time", content: loaderData.date },
        { name: "twitter:title", content: loaderData.title },
        { name: "twitter:description", content: loaderData.description },
        { name: "twitter:image", content: imageUrl },
      ],
      links: [
        {
          rel: "alternate",
          type: "application/rss+xml",
          title: "writing — rss",
          href: "/blog/rss.xml",
        },
        // prose renders in newsreader; preload both faces for LCP
        {
          rel: "preload",
          href: newsreaderWoff2,
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous",
        },
        {
          rel: "preload",
          href: newsreaderItalicWoff2,
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            datePublished: loaderData.date,
            description: loaderData.description,
            headline: loaderData.title,
            image: imageUrl,
            mainEntityOfPage: url,
            url,
          }),
        },
      ],
    };
  },
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control":
      "public, max-age=3600, stale-while-revalidate=86400",
  }),
});

function BlogNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-7 text-center font-serif-display text-ink selection:bg-rose selection:text-paper">
      <p className="rise font-mono text-faint text-xs italic">
        ( no such page. the rose checked. )
      </p>
      <Link
        className="back-link rise mt-8 font-mono text-muted text-xs"
        style={{ animationDelay: "120ms" }}
        to="/blog"
      >
        <span aria-hidden="true" className="back-arrow">
          ←
        </span>
        writing
      </Link>
    </main>
  );
}

function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  // written straight to the node; scrolling never re-renders react
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      barRef.current?.style.setProperty("transform", `scaleX(${progress})`);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-rose"
      ref={barRef}
    />
  );
}

function Toc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-8% 0px -78% 0px" }
    );
    for (const headingElement of headings) {
      observer.observe(headingElement);
    }
    return () => observer.disconnect();
  }, [entries]);

  // h4s are folded under their h3 and only unfold while you are in that section
  const rows = useMemo(() => groupChildren(entries), [entries]);
  const activeParent = entries.find((entry) => entry.id === active)?.parent;

  const link = (entry: TocEntry) => (
    <a
      className={`toc-item toc-depth-${entry.depth}${
        active === entry.id ? " toc-active" : ""
      }`}
      href={`#${entry.id}`}
      key={entry.id}
    >
      {entry.text}
    </a>
  );

  return (
    // the column spans the article so the sticky nav starts level with the
    // first paragraph and stops at the end, instead of floating mid-screen
    <aside className="toc-column">
      <div className="toc rise">
        {/* the way back rides along with the contents on wide screens */}
        <Link className="back-link toc-back" to="/blog">
          <span aria-hidden="true" className="back-arrow">
            ←
          </span>
          writing
        </Link>
        <nav aria-label="contents">
          <span className="toc-label">contents</span>
          {rows.map((row) =>
            "children" in row ? (
              <span
                className="toc-children"
                data-open={
                  active === row.parent || activeParent === row.parent
                    ? ""
                    : undefined
                }
                key={`children-${row.parent}`}
              >
                <span className="toc-children-inner">
                  {row.children.map(link)}
                </span>
              </span>
            ) : (
              link(row)
            )
          )}
        </nav>
      </div>
    </aside>
  );
}

type TocRow = TocEntry | { children: TocEntry[]; parent: string };

function groupChildren(entries: TocEntry[]): TocRow[] {
  const rows: TocRow[] = [];
  for (const entry of entries) {
    const last = rows.at(-1);
    if (entry.depth === 4 && entry.parent) {
      if (last && "children" in last && last.parent === entry.parent) {
        last.children.push(entry);
      } else {
        rows.push({ children: [entry], parent: entry.parent });
      }
    } else {
      rows.push(entry);
    }
  }
  return rows;
}

function FallingPetal() {
  const stageRef = useRef<HTMLSpanElement>(null);
  const [drop, setDrop] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setDrop(true);
        observer.disconnect();
      }
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <span aria-hidden="true" className="petal-stage" ref={stageRef}>
      {drop ? (
        <span className="petal">
          <span className="petal-glyph">*</span>
        </span>
      ) : null}
    </span>
  );
}

function PostPage() {
  const { slug } = Route.useParams();
  const post = getPost(slug);

  if (!post) {
    return null;
  }

  return (
    <main className="min-h-dvh bg-paper px-7 py-14 font-serif-display text-ink selection:bg-rose selection:text-paper md:py-24">
      <ReadingProgress />
      <div className="mx-auto w-full max-w-xl">
        <header className="border-ink/10 border-b pb-8">
          <Link
            className="back-link header-back rise font-mono text-muted text-xs"
            to="/blog"
          >
            <span aria-hidden="true" className="back-arrow">
              ←
            </span>
            writing
          </Link>
          <h1
            className="mt-9 text-[clamp(2rem,6.5vw,2.9rem)] leading-[1.1]"
            style={{ viewTransitionName: `post-${post.slug}` }}
          >
            {post.title}
            <span className="text-rose">.</span>
          </h1>
          <p
            className="rise mt-4 font-mono text-faint text-[11px]"
            style={{ animationDelay: "120ms" }}
          >
            {[
              post.dateLabel,
              ...post.meta,
              `${post.readingMinutes} min read`,
            ].join(" · ")}
          </p>
        </header>

        <div className="relative mt-10">
          <Toc entries={post.toc} />
          <article className="rise" style={{ animationDelay: "200ms" }}>
            <PostBody Content={post.Content} />
          </article>
        </div>

        <footer className="rise mt-16 text-center">
          <FallingPetal />
          <p
            aria-hidden="true"
            className="font-mono text-faint text-[11px] italic"
          >
            ( fin )
          </p>
          <Link
            className="back-link mt-6 font-mono text-muted text-xs"
            to="/blog"
          >
            <span aria-hidden="true" className="back-arrow">
              ←
            </span>
            more writing
          </Link>
        </footer>
      </div>
    </main>
  );
}
