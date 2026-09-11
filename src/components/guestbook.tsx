import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { sfx } from "@/lib/sfx";
import {
  GUESTBOOK_LIMITS,
  type GuestbookEntry,
  patchStats,
  useSiteStats,
  visitor,
} from "@/lib/stats";

const ROTATE_MS = 6000;
const THANKS_MS = 2600;
const FRESH_MS = 1800;

type Mode = "read" | "write";
type SignState = "idle" | "sending" | "cooldown" | "rude" | "failed";

const ERRORS: Partial<Record<SignState, string>> = {
  cooldown: "( you were just here. later. )",
  rude: "( be nice. )",
  failed: "( that didn't take. try again? )",
};

const PARENS_RE = /^\(\s*|\s*\)$/g;

export default function Guestbook({ caption }: { caption: string }) {
  const stats = useSiteStats();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("read");
  const [index, setIndex] = useState(0);
  const [fresh, setFresh] = useState<number | null>(null);
  const [thanks, setThanks] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const recent = stats?.recent ?? [];

  useEffect(() => {
    if (recent.length < 2) {
      return;
    }
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % recent.length),
      ROTATE_MS
    );
    return () => clearInterval(timer);
  }, [recent.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const away = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (fresh === null) {
      return;
    }
    const timer = setTimeout(() => setFresh(null), FRESH_MS);
    return () => clearTimeout(timer);
  }, [fresh]);

  useEffect(() => {
    if (!thanks) {
      return;
    }
    const timer = setTimeout(() => setThanks(false), THANKS_MS);
    return () => clearTimeout(timer);
  }, [thanks]);

  if (!stats) {
    return null;
  }

  const latest = recent[index % Math.max(1, recent.length)];

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: relays focus loss of the button and card inside it
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: same; the interactive elements are the children
    <span
      className="guestbook"
      data-open={open ? "" : undefined}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
      ref={rootRef}
    >
      <span className="guestbook-peek">
        <span className="peek-card guestbook-card">
          <span className="peek-tab">
            {mode === "write" ? "leave a line" : "guestbook"}
          </span>

          {mode === "write" ? (
            <SignForm
              key="write"
              onBack={() => setMode("read")}
              onSigned={(entry) => {
                setFresh(entry.id);
                setThanks(true);
                setMode("read");
              }}
            />
          ) : (
            <span className="gb-view" key="read">
              {recent.length > 0 ? (
                <span className="gb-section">
                  <span className="gb-label">here lately</span>
                  {recent.slice(0, 3).map((guest) => (
                    <span
                      className="guest"
                      key={`${guest.place}-${guest.ago}-${guest.path}`}
                    >
                      <span className="guest-place">{guest.place}</span>
                      <span className="guest-page">{guest.path}</span>
                      <span className="guest-ago">{guest.ago}</span>
                    </span>
                  ))}
                </span>
              ) : null}

              <span className="gb-section">
                <span className="gb-label">
                  signed
                  {stats.signed > GUESTBOOK_LIMITS.shown ? (
                    <span className="gb-count"> · {stats.signed}</span>
                  ) : null}
                </span>
                {stats.guestbook.length === 0 ? (
                  <span className="signature-empty">nobody yet.</span>
                ) : (
                  stats.guestbook.map((entry) => (
                    <span
                      className="signature"
                      data-fresh={entry.id === fresh ? "" : undefined}
                      key={entry.id}
                    >
                      <span className="signature-msg">“{entry.message}”</span>
                      <span className="signature-by">
                        <span className="dash">—</span> {entry.name}
                        {entry.place === "somewhere" ? "" : `, ${entry.place}`}
                        <span className="text-faint"> · {entry.ago}</span>
                      </span>
                    </span>
                  ))
                )}
                {thanks ? (
                  <span className="gb-thanks swap-in">
                    ( signed. thank you. )
                  </span>
                ) : (
                  <button
                    className="gb-write-link"
                    onClick={() => {
                      sfx("tick");
                      setMode("write");
                      setOpen(true);
                    }}
                    type="button"
                  >
                    leave a line <span className="arrow">→</span>
                  </button>
                )}
              </span>

              <span className="guest-foot">
                <span>
                  {stats.today} today · {stats.week.toLocaleString("en-US")}{" "}
                  this week
                </span>
                <span className="guest-no">
                  you are visitor №{" "}
                  <span className="text-ink tabular-nums">
                    {stats.total.toLocaleString("en-US")}
                  </span>
                </span>
              </span>
            </span>
          )}
        </span>
      </span>

      <button
        aria-expanded={open}
        aria-label="guestbook: who else is here"
        className="guestbook-line"
        onClick={() => {
          sfx(open ? "pause" : "pop");
          setOpen((v) => !v);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") {
            sfx("pop");
          }
        }}
        type="button"
      >
        <span aria-hidden="true" className="paren">
          (
        </span>{" "}
        <span className="guest-dot" />
        <span className="gb-corner">
          {Math.max(1, stats.online)} here
          {latest ? (
            <>
              <span aria-hidden="true" className="text-faint">
                {" · "}
              </span>
              <span className="swap-in" key={`${latest.place}-${latest.ago}`}>
                last from {latest.place}, {latest.ago}
              </span>
            </>
          ) : null}
        </span>
        <span className="gb-caption">
          <span className="swap-in" key={caption}>
            {caption.replace(PARENS_RE, "")}
          </span>
        </span>{" "}
        <span aria-hidden="true" className="paren">
          )
        </span>
      </button>
    </span>
  );
}

function SignForm({
  onBack,
  onSigned,
}: {
  onBack: () => void;
  onSigned: (entry: GuestbookEntry) => void;
}) {
  const [state, setState] = useState<SignState>("idle");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const fail = (next: SignState) => {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), THANKS_MS);
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = message.trim();
    if (!text || state === "sending") {
      return;
    }
    setState("sending");
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          message: text,
          visitor: visitor(),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok: true; entry: GuestbookEntry }
        | { ok: false; reason: string }
        | null;
      if (result?.ok) {
        sfx("pop");
        patchStats((stats) => ({
          ...stats,
          signed: stats.signed + 1,
          guestbook: [result.entry, ...stats.guestbook].slice(
            0,
            GUESTBOOK_LIMITS.shown
          ),
        }));
        onSigned(result.entry);
      } else {
        fail(
          result?.reason === "cooldown" || result?.reason === "rude"
            ? result.reason
            : "failed"
        );
      }
    } catch {
      fail("failed");
    }
  };

  const ready = message.trim().length > 0;
  const left = GUESTBOOK_LIMITS.message - message.length;

  return (
    <form
      className="gb-view sign"
      data-ready={ready ? "" : undefined}
      data-state={state}
      onSubmit={submit}
    >
      <span className="sign-text">
        “
        <Editable
          autoFocus
          label="leave a line"
          max={GUESTBOOK_LIMITS.message}
          onChange={setMessage}
          onEnter={submit}
          onEscape={onBack}
          placeholder="say something, anything"
          value={message}
        />
        ”
        <br />
        <span className="text-muted">— </span>
        <Editable
          label="your name"
          max={GUESTBOOK_LIMITS.name}
          onChange={setName}
          onEnter={submit}
          onEscape={onBack}
          placeholder="anonymous"
          value={name}
        />
        <span className="text-rose">.</span>
      </span>
      <span className="sign-foot">
        <button className="gb-back" onClick={onBack} type="button">
          <span className="arrow">←</span> back
        </button>
        {ERRORS[state] ? (
          <span className="sign-error swap-in" key={state}>
            {ERRORS[state]}
          </span>
        ) : (
          <span className="sign-actions">
            {left <= 20 ? <span className="sign-left">{left}</span> : null}
            <button
              className="sign-go"
              disabled={state === "sending" || !ready}
              type="submit"
            >
              {state === "sending" ? (
                <span className="sign-dots">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <>
                  sign <span className="arrow">→</span>
                </>
              )}
            </button>
          </span>
        )}
      </span>
    </form>
  );
}

function Editable({
  autoFocus = false,
  label,
  max,
  onChange,
  onEnter,
  onEscape,
  placeholder,
  value,
}: {
  autoFocus?: boolean;
  label: string;
  max: number;
  onChange: (value: string) => void;
  onEnter: () => void;
  onEscape: () => void;
  placeholder: string;
  value: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onEnter();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onEscape();
    }
  };

  return (
    <span
      aria-label={label}
      aria-multiline="false"
      className="ed"
      contentEditable="plaintext-only"
      data-placeholder={placeholder}
      onInput={(event) => {
        const el = event.currentTarget;
        let text = (el.textContent ?? "").replace(/\s+/g, " ");
        if (text.length > max) {
          text = text.slice(0, max);
        }
        if (text !== el.textContent) {
          el.textContent = text;
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          const selection = getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        if (!text) {
          el.replaceChildren();
        }
        onChange(text);
      }}
      onKeyDown={onKeyDown}
      ref={ref}
      role="textbox"
      suppressContentEditableWarning
      tabIndex={0}
    />
  );
}
