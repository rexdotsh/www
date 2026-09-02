import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import newsreaderItalicWoff2 from "@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2?url";
import newsreaderWoff2 from "@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2?url";
import BackLink from "@/components/back-link";
import { PostBody } from "@/components/post-body";
import { preloadFont, RSS_LINK } from "@/lib/head";
import { getPost, type TocEntry } from "@/lib/posts";
import { getPostMeta } from "@/lib/posts-meta";
import { sfx } from "@/lib/sfx";

const DEFAULT_BASE_URL = "https://rex.wf";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  notFoundComponent: BlogNotFound,
  // meta only, so the compiled post body stays out of the loader chunk
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
    // the root match carries the resolved site info
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
        RSS_LINK,
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

  // written straight to the node so scrolling never re-renders
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
      className="reading-progress fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-rose"
      ref={barRef}
    />
  );
}

type TocRow = TocEntry | { children: TocEntry[]; parent: string };

// consecutive h4s become one foldable group under their h3
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

  // the column's back link only appears once the header's has scrolled away
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

  // current = last heading above the reading line, so hash jumps and scroll
  // restoration land on the right entry too
  useEffect(() => {
    const headings = entries.flatMap(
      (entry) => document.getElementById(entry.id) ?? []
    );
    let frame = 0;
    const update = () => {
      const line = window.innerHeight * 0.24;
      const current = headings.findLast(
        (heading) => heading.getBoundingClientRect().top <= line
      );
      setActive(current?.id ?? null);
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
      onClick={() => sfx("tick")}
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
        sfx("chime");
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
          <FallingPetal />
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
