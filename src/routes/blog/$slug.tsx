import { createFileRoute, notFound } from "@tanstack/react-router";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import BackLink from "@/components/back-link";
import NotFoundPage from "@/components/not-found";
import { PostBody } from "@/components/post-body";
import { getIdentity } from "@/lib/content";
import { baseUrlOf, embedLink, pageMeta, preloadFont } from "@/lib/head";
import { getPost, metaLine, type TocEntry } from "@/lib/posts";
import { getPostMeta } from "@/lib/posts-meta";
import { SCALE, sfx } from "@/lib/sfx";
import { ogImageUrl } from "@/lib/utils";
import newsreaderItalicWoff2 from "../../fonts/newsreader-latin-italic.woff2?url";
import newsreaderWoff2 from "../../fonts/newsreader-latin.woff2?url";
import bodyCss from "../../fonts-body.css?url";
import postCss from "../../post.css?url";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  notFoundComponent: () => <NotFoundPage to="/blog" />,
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
      return { meta: [{ title: "not found" }] };
    }
    const baseUrl = baseUrlOf(matches);
    const url = `${baseUrl}/blog/${loaderData.slug}`;
    const image = `/og/${loaderData.slug}.png`;
    return {
      meta: [
        ...pageMeta({
          description: loaderData.description,
          image,
          matches,
          title: loaderData.title,
        }),
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: loaderData.date },
      ],
      links: [
        { rel: "stylesheet", href: bodyCss },
        { rel: "stylesheet", href: postCss },
        preloadFont(newsreaderWoff2),
        preloadFont(newsreaderItalicWoff2),
        embedLink(`${baseUrl}/api/embed.json?post=${loaderData.slug}`),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            author: {
              "@type": "Person",
              name: getIdentity(new URL(baseUrl).hostname).name,
              url: baseUrl,
            },
            datePublished: loaderData.date,
            description: loaderData.description,
            headline: loaderData.title,
            image: ogImageUrl(image, baseUrl),
            mainEntityOfPage: url,
            url,
          }),
        },
      ],
    };
  },
});

function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let max = 0;
    const update = () => {
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      barRef.current?.style.setProperty("scale", `${progress} 1`);
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
  backRef: RefObject<HTMLAnchorElement | null>;
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
    let frame = 0;
    const update = () => {
      const line = window.innerHeight * 0.24;
      let current: string | null = null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > line) {
          break;
        }
        current = heading.id;
      }
      setActive((previous) => (previous === current ? previous : current));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Opening a code block moves the headings without a scroll.
    const resizeObserver = new ResizeObserver(onScroll);
    resizeObserver.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
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
        <span
          className="toc-back-slot"
          data-show={showBack ? "" : undefined}
          inert={!showBack}
        >
          <span className="toc-back-inner">
            <BackLink className="toc-back" to="/blog">
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

  useEffect(() => {
    document.documentElement.dataset.smooth = "";
    return () => {
      delete document.documentElement.dataset.smooth;
    };
  }, []);

  if (!post) {
    return null;
  }

  return (
    <main className="min-h-dvh paper px-7 py-14 font-serif-display text-ink md:py-24">
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
            className="mt-9 w-fit text-[clamp(2rem,6.5vw,2.9rem)] leading-[1.1]"
            style={{ viewTransitionName: `post-${post.slug}` }}
          >
            {post.title}
            <span className="full-stop text-rose">.</span>
          </h1>
          <p
            className="rise mt-4 font-mono text-faint text-[11px]"
            style={{ animationDelay: "120ms" }}
          >
            {metaLine(post)}
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
