import { type ComponentProps, type ReactNode, useState } from "react";
import Markdown, { type Components, type ExtraProps } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import langC from "@shikijs/langs/c";
import langPython from "@shikijs/langs/python";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const PAPER_THEME = {
  name: "paper",
  type: "light" as const,
  settings: [
    { settings: { foreground: "#2b2620" } },
    {
      scope: ["keyword", "storage", "keyword.control", "keyword.operator"],
      settings: { foreground: "#b3123a" },
    },
    {
      scope: ["string", "punctuation.definition.string"],
      settings: { foreground: "#7d6840" },
    },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#a29a89", fontStyle: "italic" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character"],
      settings: { foreground: "#8f1236" },
    },
    {
      scope: ["entity.name.function", "support.function", "entity.name.type"],
      settings: { foreground: "#17140f" },
    },
  ],
};

const highlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [langPython, langC],
  themes: [PAPER_THEME],
});

const LANGS: Record<string, string> = {
  c: "c",
  py: "python",
  python: "python",
};

// FontStyle.Italic is the lowest bit of shiki's fontStyle bitmask
const isItalic = (fontStyle: number | undefined) =>
  typeof fontStyle === "number" && fontStyle % 2 === 1;

function HighlightedCode({ code, lang }: { code: string; lang?: string }) {
  if (!lang) {
    return <code>{code}</code>;
  }
  const lines = highlighter.codeToTokensBase(code, {
    lang: lang as "python" | "c",
    theme: "paper",
  });
  return (
    <code>
      {lines.map((line, lineIndex) => (
        <span key={`l${lineIndex}`}>
          {line.map((token) => (
            <span
              key={token.offset}
              style={{
                color: token.color,
                fontStyle: isItalic(token.fontStyle) ? "italic" : undefined,
              }}
            >
              {token.content}
            </span>
          ))}
          {"\n"}
        </span>
      ))}
    </code>
  );
}

const COPIED_MS = 1600;

function CodeShell({ code, lang }: { code: string; lang?: string }) {
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
            .catch(() => {
              // clipboard unavailable; the button just stays quiet
            });
        }}
        type="button"
      >
        {copied ? "( copied )" : "copy"}
      </button>
      <pre className="code-card">
        <HighlightedCode code={code} lang={lang} />
      </pre>
    </div>
  );
}

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
  const fenceLang = /language-(\w+)/.exec(className ?? "")?.[1];
  if (!fenceLang) {
    return <code>{children}</code>;
  }
  const code = String(children).replace(/\n$/, "");
  const lang = LANGS[fenceLang];
  const meta = (node?.data as { meta?: string } | undefined)?.meta ?? "";
  const title = /title="([^"]+)"/.exec(meta)?.[1];
  const shell = <CodeShell code={code} lang={lang} />;
  if (title && meta.includes("collapsed")) {
    return (
      <details className="code-details">
        <summary className="code-summary">{title}</summary>
        {shell}
      </details>
    );
  }
  if (title) {
    return (
      <figure className="code-figure">
        <figcaption className="code-title">{title}</figcaption>
        {shell}
      </figure>
    );
  }
  return shell;
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
  pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
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
