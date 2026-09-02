import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

const MIN_CHARS = 12;
const MAX_CHARS = 600;
const EDGE_WORDS = 4;

// a text fragment that lands a reader on the passage. dashes are escaped
// because a bare one means prefix/suffix to the fragment parser
const fragment = (text: string) => {
  const words = text.split(" ");
  const part = (list: string[]) =>
    encodeURIComponent(list.join(" ")).replace(/-/g, "%2D");
  if (words.length <= EDGE_WORDS * 2) {
    return part(words);
  }
  return `${part(words.slice(0, EDGE_WORDS))},${part(words.slice(-EDGE_WORDS))}`;
};

const selectedPassage = () => {
  const selection = document.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const scope = range.commonAncestorContainer.parentElement;
  if (!scope?.closest(".prose-post") || scope.closest("pre, code")) {
    return null;
  }
  const text = selection.toString().replace(/\s+/g, " ").trim();
  if (text.length < MIN_CHARS || text.length > MAX_CHARS) {
    return null;
  }
  return { range, text };
};

// select a passage in a post and a small note offers to copy it as a quote,
// with a link that opens on the very words. pointer devices only: touch has
// its own selection furniture right where this would sit
export default function QuoteBubble({ title }: { title: string }) {
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const bubbleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const place = () => {
      const passage = selectedPassage();
      if (!passage) {
        setSpot(null);
        setCopied(false);
        return;
      }
      const rect = passage.range.getBoundingClientRect();
      setSpot({
        x: Math.min(
          Math.max(rect.left + rect.width / 2, 48),
          window.innerWidth - 48
        ),
        y: Math.max(rect.top, 40),
      });
    };
    const onSelectionChange = () => {
      clearTimeout(timer);
      timer = setTimeout(place, 140);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, []);

  const copy = () => {
    const passage = selectedPassage();
    if (!passage) {
      return;
    }
    const url = `${location.origin}${location.pathname}#:~:text=${fragment(passage.text)}`;
    navigator.clipboard
      .writeText(`"${passage.text}"\n\nrex, ${title}\n${url}`)
      .then(() => {
        setCopied(true);
        sfx("pop");
      })
      .catch(() => undefined);
  };

  if (!spot) {
    return null;
  }

  return (
    <button
      className="quote-bubble"
      key={copied ? "copied" : "quote"}
      onClick={copy}
      // the click must not clear the selection before we read it
      onMouseDown={(event) => event.preventDefault()}
      ref={bubbleRef}
      style={{ left: spot.x, top: spot.y }}
      type="button"
    >
      {copied ? "( copied )" : "( quote )"}
    </button>
  );
}
