import { type FormEvent, useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";
import {
  GUESTBOOK_LIMITS,
  type GuestbookEntry,
  patchStats,
  useSiteStats,
  visitor,
} from "@/lib/stats";

const ROTATE_MS = 6000;
const HINT_MS = 2600;

type SignState = "idle" | "sending" | "signed" | "cooldown" | "failed";

const HINTS: Record<SignState, string> = {
  idle: "enter to sign",
  sending: "…",
  signed: "( signed. thank you. )",
  cooldown: "( you were just here. later. )",
  failed: "( that didn't take. try again? )",
};

export default function Guestbook() {
  const stats = useSiteStats();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
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
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

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
          <span className="peek-tab">guestbook</span>

          {recent.length > 0 ? (
            <span className="guest-list">
              {recent.slice(0, 4).map((guest) => (
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

          <Signatures entries={stats.guestbook} />
          <SignForm />

          <span className="guest-foot">
            <span>
              {stats.today} today · {stats.week.toLocaleString("en-US")} this
              week
            </span>
            <span className="guest-no">
              you are visitor №{" "}
              <span className="tabular-nums">
                {stats.total.toLocaleString("en-US")}
              </span>
            </span>
          </span>
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
        ) : null}{" "}
        <span aria-hidden="true" className="paren">
          )
        </span>
      </button>
    </span>
  );
}

function Signatures({ entries }: { entries: GuestbookEntry[] }) {
  return (
    <span className="signatures">
      {entries.length === 0 ? (
        <span className="signature-empty">
          nobody has signed yet. be first.
        </span>
      ) : (
        entries.map((entry) => (
          <span className="signature" key={entry.id}>
            <span className="signature-msg">“{entry.message}”</span>
            <span className="signature-by">
              — {entry.name}
              {entry.place === "somewhere" ? "" : `, ${entry.place}`} ·{" "}
              {entry.ago}
            </span>
          </span>
        ))
      )}
    </span>
  );
}

function SignForm() {
  const [state, setState] = useState<SignState>("idle");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const settle = (next: SignState) => {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), HINT_MS);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
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
          guestbook: [result.entry, ...stats.guestbook].slice(
            0,
            GUESTBOOK_LIMITS.shown
          ),
        }));
        setMessage("");
        settle("signed");
      } else {
        settle(result?.reason === "cooldown" ? "cooldown" : "failed");
      }
    } catch {
      settle("failed");
    }
  };

  return (
    <form className="sign" onSubmit={submit}>
      <span className="sign-row">
        <input
          aria-label="your name"
          autoComplete="off"
          className="sign-name"
          maxLength={GUESTBOOK_LIMITS.name}
          onChange={(event) => setName(event.target.value)}
          placeholder="name"
          value={name}
        />
        <input
          aria-label="leave a line"
          autoComplete="off"
          className="sign-msg"
          maxLength={GUESTBOOK_LIMITS.message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="leave a line"
          required
          value={message}
        />
      </span>
      <button
        className="sign-hint"
        disabled={state === "sending"}
        type="submit"
      >
        <span className="swap-in" key={state}>
          {HINTS[state]}
        </span>
      </button>
    </form>
  );
}
