import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import BackLink from "@/components/back-link";
import { PostBody } from "@/components/post-body";
import { EMBED_REL, postEmbed } from "@/lib/discord-embed";
import { preloadFont, RSS_LINK } from "@/lib/head";
import { getPost, type TocEntry } from "@/lib/posts";
import { getPostMeta } from "@/lib/posts-meta";
import { SCALE, sfx } from "@/lib/sfx";
import { ogImageUrl } from "@/lib/utils";
import newsreaderItalicWoff2 from "../../fonts/newsreader-latin-italic.woff2?url";
import newsreaderWoff2 from "../../fonts/newsreader-latin.woff2?url";
import bodyCss from "../../fonts-body.css?url";
import postCss from "../../post.css?url";

const DEFAULT_BASE_URL = "https://rex.wf";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  notFoundComponent: BlogNotFound,
  loader: ({ params }) => {
    const post = getPostMeta(params.slug);
    if (!post) {
      throw notFound();
    }
    const { date, description, slug, title } = post;
    return { date, description, slug, title };
  },
  head: ({ loaderData, matches }) => {
    if (!loaderData) {
      return { meta: [{ title: "writing" }] };
    }
    const baseUrl =
      (matches[0]?.loaderData as { baseUrl?: string } | undefined)?.baseUrl ??
      DEFAULT_BASE_URL;
    const url = `${baseUrl}/blog/${loaderData.slug}`;
    const imageUrl = ogImageUrl(`/og/${loaderData.slug}.png`, baseUrl);
    const post = getPost(loaderData.slug);
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
        RSS_LINK,
        { rel: "stylesheet", href: bodyCss },
        { rel: "stylesheet", href: postCss },
        preloadFont(newsreaderWoff2),
        preloadFont(newsreaderItalicWoff2),
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
        ...(post
          ? [
              {
                id: EMBED_REL,
                type: "application/json",
                children: JSON.stringify(postEmbed(baseUrl, imageUrl, post)),
              },
            ]
          : []),
      ],
    };
  },
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control": "public, max-age=3600",
  }),
});

function BlogNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center paper px-7 text-center font-serif-display text-ink selection:bg-rose selection:text-paper">
      <p className="rise font-mono text-faint text-xs italic">
        ( no such page. the rose checked. )
      </p>
      <BackLink
        className="rise mt-8 font-mono text-muted text-xs"
        style={{ animationDelay: "120ms" }}
        to="/blog"
      >
        writing
      </BackLink>
    </main>
  );
}

function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let max = 0;
    const update = () => {
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      barRef.current?.style.setProperty("transform", `scaleX(${progress})`);
    };
    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
      update();
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.documentElement);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="reading-progress fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-rose"
      ref={barRef}
    />
  );
}

type TocRow = TocEntry | { children: TocEntry[]; parent: string };

function groupChildren(entries: TocEntry[]): TocRow[] {
  const rows: TocRow[] = [];
  for (const entry of entries) {
    const last = rows.at(-1);
    if (!(entry.depth === 4 && entry.parent)) {
      rows.push(entry);
    } else if (last && "children" in last && last.parent === entry.parent) {
      last.children.push(entry);
    } else {
      rows.push({ children: [entry], parent: entry.parent });
    }
  }
  return rows;
}

function Toc({
  backRef,
  entries,
}: {
  backRef: React.RefObject<HTMLAnchorElement | null>;
  entries: TocEntry[];
}) {
  const navRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const rows = useMemo(() => groupChildren(entries), [entries]);
  const activeParent = entries.find((entry) => entry.id === active)?.parent;

  useEffect(() => {
    const anchor = backRef.current;
    if (!anchor) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setShowBack(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [backRef]);

  useEffect(() => {
    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((heading): heading is HTMLElement => heading !== null);
    let positions: { id: string; top: number }[] = [];
    let frame = 0;
    const update = () => {
      const line = window.scrollY + window.innerHeight * 0.24;
      let current: string | null = null;
      for (const heading of positions) {
        if (heading.top > line) {
          break;
        }
        current = heading.id;
      }
      setActive((previous) => (previous === current ? previous : current));
    };
    const measure = () => {
      const scrollTop = window.scrollY;
      positions = headings.map((heading) => ({
        id: heading.id,
        top: heading.getBoundingClientRect().top + scrollTop,
      }));
      update();
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
    };
  }, [entries]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return;
    }
    const place = () => {
      const current = active
        ? nav.querySelector<HTMLElement>(`[href="#${active}"]`)
        : null;
      if (!current) {
        nav.style.setProperty("--toc-on", "0");
        return;
      }
      nav.style.setProperty("--toc-on", "1");
      nav.style.setProperty("--toc-y", `${current.offsetTop}px`);
      nav.style.setProperty("--toc-h", `${current.offsetHeight}px`);
    };
    const onSettle = (event: TransitionEvent) => {
      if (event.propertyName === "grid-template-rows") {
        place();
      }
    };
    place();
    nav.addEventListener("transitionend", onSettle);
    return () => nav.removeEventListener("transitionend", onSettle);
  }, [active]);

  const link = (entry: TocEntry) => (
    <a
      className={`toc-item toc-depth-${entry.depth}${
        active === entry.id ? " toc-active" : ""
      }`}
      href={`#${entry.id}`}
      key={entry.id}
      onClick={() =>
        sfx("tick", SCALE.at(-1 - (entries.indexOf(entry) % SCALE.length)))
      }
    >
      {entry.text}
    </a>
  );

  return (
    <aside className="toc-column">
      <div className="toc rise" ref={navRef}>
        <span className="toc-back-slot" data-show={showBack ? "" : undefined}>
          <span className="toc-back-inner">
            <BackLink
              className="toc-back"
              tabIndex={showBack ? undefined : -1}
              to="/blog"
            >
              writing
            </BackLink>
          </span>
        </span>
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

// Drawn in order: the stem grows, then the bloom opens.
const INK_ROSE: [part: "stem" | "bloom", d: string][] = [
  ["stem", "M23.7 63C25.2 50 22.8 40 24 28.4"],
  ["stem", "M24.3 36.5l-2.5-1.3 2.3 2.9"],
  ["stem", "M24.1 45.5c2.5-4.3 7.5-6.1 11.9-5.1-1.4 4.7-6.6 7.4-11.9 5.1Z"],
  ["stem", "M23.9 53.5c-2.2-3.4-6-4.7-9.4-3.5 1.4 3.7 5.4 5.6 9.4 3.5Z"],
  ["stem", "M23.4 28.2c-.8 2-2.6 3.3-4.9 3.6M24.6 28.2c.8 2 2.6 3.3 4.9 3.6"],
  ["bloom", "M24 28c-6.4-.2-10.8-5.6-10.6-12.3 3.1 1 5.6 3.2 7 6.2"],
  ["bloom", "M24 28c6.4-.2 10.8-5.6 10.6-12.3-3.1 1-5.6 3.2-7 6.2"],
  ["bloom", "M13.4 15.7c-.3-4.4 2.4-8 6.1-8.6 1.4 1.9 1.8 4.1 1.2 6.4"],
  ["bloom", "M34.6 15.7c.3-4.4-2.4-8-6.1-8.6-1.4 1.9-1.8 4.1-1.2 6.4"],
  [
    "bloom",
    "M24.3 15a1 1 0 0 1 2 0 2 2 0 0 1-4 0 3 3 0 0 1 6 0 3.6 3.6 0 0 1-7 .8",
  ],
  ["bloom", "M19.1 7.1c1.6-2 3.4-2.9 4.9-2.9s3.3.9 4.9 2.9"],
];
const INK_STEP_MS = 170;
const INK_DRAWN_MS = INK_ROSE.length * INK_STEP_MS + 500;

function InkRose() {
  const stageRef = useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    let chime: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setDrawn(true);
        chime = setTimeout(() => sfx("chime"), INK_DRAWN_MS);
        observer.disconnect();
      }
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      clearTimeout(chime);
    };
  }, []);

  return (
    <span
      aria-hidden="true"
      className="petal-stage"
      data-drawn={drawn ? "" : undefined}
      ref={stageRef}
      style={{ "--drop": `${INK_DRAWN_MS}ms` } as React.CSSProperties}
    >
      <svg aria-hidden="true" className="ink-rose" viewBox="0 0 48 72">
        {INK_ROSE.map(([part, d], index) => (
          <path
            className={part}
            d={d}
            key={d}
            pathLength={1}
            style={{ animationDelay: `${index * INK_STEP_MS}ms` }}
          />
        ))}
      </svg>
      {drawn ? (
        <span className="petal-fall">
          <span className="petal" />
        </span>
      ) : null}
    </span>
  );
}

function PostPage() {
  const { slug } = Route.useParams();
  const post = getPost(slug);
  const headerBackRef = useRef<HTMLAnchorElement>(null);

  if (!post) {
    return null;
  }

  return (
    <main className="min-h-dvh paper px-7 py-14 font-serif-display text-ink selection:bg-rose selection:text-paper md:py-24">
      <ReadingProgress />
      <div className="mx-auto w-full max-w-xl">
        <header className="post-header">
          <BackLink
            className="rise font-mono text-muted text-xs"
            ref={headerBackRef}
            to="/blog"
          >
            writing
          </BackLink>
          <h1
            className="mt-9 text-[clamp(2rem,6.5vw,2.9rem)] leading-[1.1]"
            style={{ viewTransitionName: `post-${post.slug}` }}
          >
            {post.title}
            <span className="full-stop text-rose">.</span>
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
          <Toc backRef={headerBackRef} entries={post.toc} />
          <article className="rise" style={{ animationDelay: "200ms" }}>
            <PostBody Content={post.Content} />
          </article>
        </div>

        <footer className="rise mt-16 text-center">
          <InkRose />
          <p
            aria-hidden="true"
            className="font-mono text-faint text-[11px] italic"
          >
            ( fin )
          </p>
          <BackLink className="mt-6 font-mono text-muted text-xs" to="/blog">
            more writing
          </BackLink>
        </footer>
      </div>
    </main>
  );
}
