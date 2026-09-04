import type { MDXComponents, MDXContent } from "mdx/types";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import VideoPlayer from "@/components/video-player";
import { sfx } from "@/lib/sfx";

const COPIED_MS = 1600;

const QUIET_LANGS = new Set(["text", "txt", "plaintext", "plain", ""]);

function Pre({ children, ...props }: ComponentProps<"pre">) {
  const data = props as { "data-code"?: string; "data-lang"?: string };
  const code = data["data-code"] ?? "";
  const lang = data["data-lang"] ?? "";
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-shell">
      <span className="code-tools">
        <button
          className="code-copy"
          onClick={() => {
            navigator.clipboard
              .writeText(code)
              .then(() => {
                setCopied(true);
                sfx("pop");
                setTimeout(() => setCopied(false), COPIED_MS);
              })
              .catch(() => undefined);
          }}
          type="button"
        >
          <span className="swap-in" key={String(copied)}>
            {copied ? "( copied )" : "copy"}
          </span>
        </button>
        {QUIET_LANGS.has(lang) ? null : (
          <span aria-hidden="true" className="code-lang">
            {lang}
          </span>
        )}
      </span>
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
  const imageRef = useRef<HTMLImageElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (imageRef.current && !imageRef.current.complete) {
      setPending(true);
    }
  }, []);

  return (
    // biome-ignore lint/correctness/useImageSize: post images vary
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: tracks fade-in
    <img
      alt={alt}
      className="post-media"
      data-pending={pending ? "" : undefined}
      decoding="async"
      loading="lazy"
      onLoad={() => setPending(false)}
      ref={imageRef}
      src={src}
    />
  );
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
