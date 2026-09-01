import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PostBody } from "@/components/post-body";
import { getPost, getToc, type TocEntry } from "@/lib/posts";

const DEFAULT_BASE_URL = "https://rex.wf";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  notFoundComponent: BlogNotFound,
  loader: ({ params }) => {
    const post = getPost(params.slug);
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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#faf8f2] px-7 text-center font-serif-display text-[#17140f] selection:bg-[#b3123a] selection:text-[#faf8f2]">
      <p className="rise font-mono text-[#a29a89] text-xs italic">
        ( no such page. the rose checked. )
      </p>
      <Link
        className="back-link rise mt-8 font-mono text-[#847c6c] text-xs"
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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
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
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-[#b3123a]"
      style={{ transform: `scaleX(${progress})` }}
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

  return (
    <nav aria-label="contents" className="toc rise">
      <span className="toc-label">contents</span>
      {entries.map((entry) => (
        <a
          className={`toc-item${entry.depth === 3 ? " toc-sub" : ""}${
            active === entry.id ? " toc-active" : ""
          }`}
          href={`#${entry.id}`}
          key={entry.id}
        >
          {entry.text}
        </a>
      ))}
    </nav>
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
    <main className="min-h-dvh bg-[#faf8f2] px-7 py-14 font-serif-display text-[#17140f] selection:bg-[#b3123a] selection:text-[#faf8f2] md:py-24">
      <ReadingProgress />
      <Toc entries={getToc(post.body)} />
      <div className="mx-auto w-full max-w-xl">
        <header className="border-[#17140f]/10 border-b pb-8">
          <Link
            className="back-link rise font-mono text-[#847c6c] text-xs"
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
            <span className="text-[#b3123a]">.</span>
          </h1>
          <p
            className="rise mt-4 font-mono text-[#a29a89] text-[11px]"
            style={{ animationDelay: "120ms" }}
          >
            {[
              post.dateLabel,
              ...post.meta,
              `${post.readingMinutes} min read`,
            ].join(" · ")}
          </p>
        </header>

        <article className="rise mt-10" style={{ animationDelay: "200ms" }}>
          <PostBody markdown={post.body} />
        </article>

        <footer className="rise mt-16 text-center">
          <FallingPetal />
          <p
            aria-hidden="true"
            className="font-mono text-[#a29a89] text-[11px] italic"
          >
            ( fin )
          </p>
          <Link
            className="back-link mt-6 font-mono text-[#847c6c] text-xs"
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
