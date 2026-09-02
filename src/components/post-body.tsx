import type { MDXComponents, MDXContent } from "mdx/types";
import { type ComponentProps, type ReactNode, useState } from "react";
import VideoPlayer from "@/components/video-player";

const COPIED_MS = 1600;

function Pre({ children, ...props }: ComponentProps<"pre">) {
  const code = (props as { "data-code"?: string })["data-code"] ?? "";
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-shell">
      <button
        className="code-copy"
        onClick={() => {
          navigator.clipboard
            .writeText(code)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), COPIED_MS);
            })
            .catch(() => undefined);
        }}
        type="button"
      >
        {copied ? "( copied )" : "copy"}
      </button>
      <pre className="code-card">{children}</pre>
    </div>
  );
}

function heading(Tag: "h2" | "h3" | "h4") {
  return ({ id, children }: ComponentProps<"h2">) => (
    <Tag id={id}>
      <a className="heading-anchor" href={`#${id}`}>
        {children}
      </a>
    </Tag>
  );
}

function CodeFile({
  children,
  collapsed = false,
  title,
}: {
  children: ReactNode;
  collapsed?: boolean;
  title: string;
}) {
  if (collapsed) {
    return (
      <details className="code-details">
        <summary className="code-summary">{title}</summary>
        {children}
      </details>
    );
  }
  return (
    <figure className="code-figure">
      <figcaption className="code-title">{title}</figcaption>
      {children}
    </figure>
  );
}

function Figure({ alt = "", src }: { alt?: string; src: string }) {
  // biome-ignore lint/correctness/useImageSize: intrinsic sizes vary per post
  return <img alt={alt} className="post-media" loading="lazy" src={src} />;
}

const COMPONENTS: MDXComponents = {
  a: ({ href, children }) => (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  ),
  CodeFile,
  Figure,
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  pre: Pre,
  Video: VideoPlayer,
};

export function PostBody({ Content }: { Content: MDXContent }) {
  return (
    <div className="prose-post">
      <Content components={COMPONENTS} />
    </div>
  );
}
