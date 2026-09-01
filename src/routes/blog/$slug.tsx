import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PostBody } from "@/components/post-body";
import { getPost } from "@/lib/posts";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) {
      throw notFound();
    }
    return { description: post.description, title: post.title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title ?? "writing" },
      { name: "description", content: loaderData?.description ?? "" },
      { property: "og:title", content: loaderData?.title ?? "writing" },
      { property: "og:description", content: loaderData?.description ?? "" },
      { property: "og:type", content: "article" },
    ],
  }),
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control":
      "public, max-age=3600, stale-while-revalidate=86400",
  }),
});

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

function PostPage() {
  const { slug } = Route.useParams();
  const post = getPost(slug);

  if (!post) {
    return null;
  }

  return (
    <main className="min-h-dvh bg-[#faf8f2] px-7 py-14 font-serif-display text-[#17140f] selection:bg-[#b3123a] selection:text-[#faf8f2] md:py-24">
      <ReadingProgress />
      <div className="mx-auto w-full max-w-xl">
        <header>
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
            className="rise mt-10 text-[clamp(2rem,6.5vw,2.9rem)] leading-[1.1]"
            style={{ animationDelay: "80ms" }}
          >
            {post.title}
            <span className="text-[#b3123a]">.</span>
          </h1>
          <p
            className="rise mt-4 font-mono text-[#a29a89] text-[11px]"
            style={{ animationDelay: "150ms" }}
          >
            {[post.dateLabel, ...post.meta].join(" · ")}
          </p>
        </header>

        <article className="rise mt-12" style={{ animationDelay: "230ms" }}>
          <PostBody markdown={post.body} />
        </article>

        <footer className="rise mt-20 text-center">
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
