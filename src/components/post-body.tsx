import type { MDXComponents, MDXContent } from "mdx/types";
import { type ComponentProps, type ReactNode, useState } from "react";
import langC from "@shikijs/langs/c";
import langPython from "@shikijs/langs/python";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const paperTheme = (
  name: string,
  colors: {
    body: string;
    comment: string;
    constant: string;
    entity: string;
    keyword: string;
    string: string;
  }
) => ({
  name,
  type: "light" as const,
  settings: [
    { settings: { foreground: colors.body } },
    {
      scope: ["keyword", "storage", "keyword.control", "keyword.operator"],
      settings: { foreground: colors.keyword },
    },
    {
      scope: ["string", "punctuation.definition.string"],
      settings: { foreground: colors.string },
    },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: colors.comment, fontStyle: "italic" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character"],
      settings: { foreground: colors.constant },
    },
    {
      scope: ["entity.name.function", "support.function", "entity.name.type"],
      settings: { foreground: colors.entity },
    },
  ],
});

const highlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [langPython, langC],
  themes: [
    paperTheme("paper", {
      body: "#2b2620",
      comment: "#a29a89",
      constant: "#8f1236",
      entity: "#17140f",
      keyword: "#b3123a",
      string: "#7d6840",
    }),
    paperTheme("paper-dark", {
      body: "#cfcdc9",
      comment: "#75716a",
      constant: "#ef7d99",
      entity: "#e8e6e3",
      keyword: "#e5476d",
      string: "#c9a769",
    }),
  ],
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
  // same tokenization either way; only the colors differ between themes
  const lines = highlighter.codeToTokensBase(code, {
    lang: lang as "python" | "c",
    theme: "paper",
  });
  const darkLines = highlighter.codeToTokensBase(code, {
    lang: lang as "python" | "c",
    theme: "paper-dark",
  });
  return (
    <code>
      {lines.map((line, lineIndex) => (
        <span key={`l${lineIndex}`}>
          {line.map((token, tokenIndex) => {
            const dark = darkLines[lineIndex]?.[tokenIndex]?.color;
            return (
              <span
                key={token.offset}
                style={{
                  color:
                    token.color && dark
                      ? `light-dark(${token.color}, ${dark})`
                      : token.color,
                  fontStyle: isItalic(token.fontStyle) ? "italic" : undefined,
                }}
              >
                {token.content}
              </span>
            );
          })}
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
  return ({ id, children }: ComponentProps<"h2">) => (
    <Tag id={id}>
      <a className="heading-anchor" href={`#${id}`}>
        {children}
      </a>
    </Tag>
  );
}

function Code({ className, children }: ComponentProps<"code">) {
  const fenceLang = /language-(\w+)/.exec(className ?? "")?.[1];
  if (!fenceLang) {
    return <code>{children}</code>;
  }
  const code = String(children).replace(/\n$/, "");
  return <CodeShell code={code} lang={LANGS[fenceLang]} />;
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

function Video({ src }: { src: string }) {
  return (
    // biome-ignore lint/a11y/useMediaCaption: silent screen recordings
    <video
      className="post-media"
      controls
      playsInline
      preload="metadata"
      src={src}
    />
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
  code: Code,
  CodeFile,
  Figure,
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  // block code renders its own card; unwrap the default pre
  pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Video,
};

export function PostBody({ Content }: { Content: MDXContent }) {
  return (
    <div className="prose-post">
      <Content components={COMPONENTS} />
    </div>
  );
}
