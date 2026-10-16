import type { MDXComponents, MDXContent } from "mdx/types";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import VideoPlayer from "@/components/video-player";
import { useCopied } from "@/lib/use-copied";

const QUIET_LANGS = new Set(["text", "txt", "plaintext", "plain", ""]);

function Pre({ children, tabIndex, ...props }: ComponentProps<"pre">) {
  const data = props as { "data-code"?: string; "data-lang"?: string };
  const code = data["data-code"] ?? "";
  const lang = data["data-lang"] ?? "";
  const [copied, copy] = useCopied();
  return (
    <div className="code-shell">
      <span className="code-tools">
        <button className="code-copy" onClick={() => copy(code)} type="button">
          <span aria-live="polite" className="swap-in" key={String(copied)}>
            {copied ? "( copied )" : "copy"}
          </span>
        </button>
        {QUIET_LANGS.has(lang) ? null : (
          <span aria-hidden="true" className="code-lang">
            {lang}
          </span>
        )}
      </span>
      <pre className="code-card" tabIndex={tabIndex}>
        {children}
      </pre>
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

function Figure({
  alt,
  height,
  src,
  width,
}: {
  alt: string;
  height: number;
  src: string;
  width: number;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (imageRef.current && !imageRef.current.complete) {
      setPending(true);
    }
  }, []);

  return (
    <img
      alt={alt}
      className="post-media"
      data-pending={pending ? "" : undefined}
      decoding="async"
      height={height}
      loading="lazy"
      onError={() => setPending(false)}
      onLoad={() => setPending(false)}
      ref={imageRef}
      src={src}
      width={width}
    />
  );
}

function Fleuron() {
  return (
    <div className="fleuron" role="separator">
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.6"
        viewBox="36 4 48 16"
      >
        <path
          className="fleuron-core"
          d="M60 8C62.4 9.8 62.4 14.2 60 16 57.6 14.2 57.6 9.8 60 8Z"
          pathLength="1"
        />
        {["", "matrix(-1 0 0 1 120 0)"].map((flip) => (
          <g key={flip} transform={flip || undefined}>
            <path
              d="M55.5 12C49 12 46.5 7 42 7.4 38 7.8 37.6 12.8 41 13.2 43.4 13.5 44 10.6 42 10.2"
              pathLength="1"
            />
            <path d="M51 12.4C47.5 15.4 43.5 17 38.5 16.4" pathLength="1" />
          </g>
        ))}
      </svg>
    </div>
  );
}

const COMPONENTS: MDXComponents = {
  a: ({ href, children }) =>
    href?.startsWith("http") ? (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    ) : (
      <a href={href}>{children}</a>
    ),
  CodeFile,
  Figure,
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  hr: Fleuron,
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
