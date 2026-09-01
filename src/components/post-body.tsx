import type { ComponentProps } from "react";
import Markdown, { type Components, type ExtraProps } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

function heading(Tag: "h2" | "h3" | "h4") {
  return ({ id, children }: ComponentProps<"h2"> & ExtraProps) => (
    <Tag id={id}>
      <a className="heading-anchor" href={`#${id}`}>
        {children}
      </a>
    </Tag>
  );
}

function Code({
  className,
  children,
  node,
}: ComponentProps<"code"> & ExtraProps) {
  if (!className?.includes("language-")) {
    return <code>{children}</code>;
  }
  const meta = (node?.data as { meta?: string } | undefined)?.meta ?? "";
  const title = /title="([^"]+)"/.exec(meta)?.[1];
  const card = (
    <pre className="code-card">
      <code>{children}</code>
    </pre>
  );
  if (title && meta.includes("collapsed")) {
    return (
      <details className="code-details">
        <summary className="code-summary">{title}</summary>
        {card}
      </details>
    );
  }
  if (title) {
    return (
      <figure className="code-figure">
        <figcaption className="code-title">{title}</figcaption>
        {card}
      </figure>
    );
  }
  return card;
}

function Media({ src, alt }: ComponentProps<"img">) {
  const url = typeof src === "string" ? src : undefined;
  if (alt === "video") {
    return (
      // biome-ignore lint/a11y/useMediaCaption: silent screen recordings
      <video
        className="post-media"
        controls
        playsInline
        preload="metadata"
        src={url}
      />
    );
  }
  // biome-ignore lint/correctness/useImageSize: intrinsic sizes unknown for markdown-sourced media
  return <img alt="" className="post-media" loading="lazy" src={url} />;
}

const COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  ),
  code: Code,
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  img: Media,
  // block code renders its own card; unwrap the default pre
  pre: ({ children }) => <>{children}</>,
};

export function PostBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose-post">
      <Markdown
        components={COMPONENTS}
        rehypePlugins={[rehypeSlug]}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
