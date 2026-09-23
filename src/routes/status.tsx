import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createContext, type ReactNode, use, useEffect, useState } from "react";
import BackLink from "@/components/back-link";
import { Gauge, Lamp, Sparkline, Strip, useTween } from "@/components/fleet";
import {
  type Fleet,
  fmtGb,
  fmtMb,
  fmtUptime,
  type Host,
  mockFleet,
  pct,
  summarize,
} from "@/lib/fleet";
import { preloadFont } from "@/lib/head";
import { SCALE, sfx } from "@/lib/sfx";
import newsreaderItalicWoff2 from "../fonts/newsreader-latin-italic.woff2?url";
import bodyCss from "../fonts-body.css?url";
import statusCss from "../status.css?url";

const DESCRIPTION = "four machines and what they run.";

// A server fn so client-side navigation doesn't pull cloudflare:workers into the browser bundle.
const getFleet = createServerFn({ method: "GET" }).handler(
  async (): Promise<Fleet> => {
    const { fleet } = await import("@/server/fleet-auth");
    const stub = fleet();
    if (!stub) {
      return mockFleet();
    }
    // RPC results carry Symbol.dispose and widen tuples; the DO built a real Fleet.
    const { hosts, services, measuredAt } = await stub.snapshot();
    return { hosts, services, measuredAt } as Fleet;
  }
);

export const Route = createFileRoute("/status")({
  component: StatusPage,
  loader: async () => ({ fleet: await getFleet() }),
  head: () => ({
    meta: [
      { title: "the workshop" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "the workshop" },
      { property: "og:description", content: DESCRIPTION },
    ],
    links: [
      { rel: "stylesheet", href: bodyCss },
      { rel: "stylesheet", href: statusCss },
      preloadFont(newsreaderItalicWoff2),
    ],
  }),
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control": "public, max-age=30",
  }),
});

const WORDS =
  "no one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(
    " "
  );
const words = (n: number) => WORDS[n] ?? String(n);

const TICK_MS = 30_000;

const ago = (then: number, now: number) => {
  const m = Math.max(0, Math.floor((now - then) / 60_000));
  return m < 1
    ? `${Math.max(0, Math.round((now - then) / 1000))}s`
    : m < 60
      ? `${m}m`
      : `${Math.floor(m / 60)}h ${m % 60}m`;
};

const wobble = (f: Fleet): Fleet => ({
  ...f,
  measuredAt: Date.now() - 600,
  hosts: f.hosts.map((h) => {
    if (h.health !== "up") return h;
    const cpu = Math.min(
      99,
      Math.max(1, h.cpu + Math.round((Math.random() - 0.5) * 9))
    );
    return {
      ...h,
      cpu,
      cpuSpark: [...h.cpuSpark.slice(1), cpu],
      lastSeen: Date.now() - 600,
    };
  }),
});

function useLiveFleet(initial: Fleet) {
  const [fleet, setFleet] = useState(initial);
  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (initial.mock) return setFleet(wobble);
      fetch("/api/fleet")
        .then((r) => (r.ok ? (r.json() as Promise<Fleet>) : null))
        .then((f) => f && setFleet(f))
        .catch(() => undefined);
    }, TICK_MS);
    return () => clearInterval(tick);
  }, [initial.mock]);
  return fleet;
}

// The clock ticks every second but only a few strings read it: keep it in
// context so the tick re-renders those, not the page.
const Now = createContext(0);

function NowProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial: number;
}) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);
  return <Now value={now}>{children}</Now>;
}

function Live({ children }: { children: (now: number) => ReactNode }) {
  return children(use(Now));
}

const stagger = (start: number, step: number) => {
  let n = 0;
  return () => {
    const ms = start + n * step;
    n += 1;
    return ms;
  };
};

const rise = (ms: number) => ({ animationDelay: `${ms}ms` });

function StatusPage() {
  const { fleet: initial } = Route.useLoaderData();
  const fleet = useLiveFleet(initial);
  const sum = summarize(fleet);
  const head = stagger(0, 70);
  const panels = stagger(320, 100);
  const rows = stagger(780, 30);

  return (
    <NowProvider initial={initial.measuredAt + 12_000}>
      <main className="min-h-dvh paper px-7 py-10 text-ink selection:bg-rose selection:text-paper md:py-14">
        <div className="tty mx-auto w-full max-w-4xl">
          <BackLink
            className="rise text-muted text-xs"
            style={rise(head())}
            to="/"
          >
            home
          </BackLink>

          <h1
            className="rise mt-8 font-serif-display text-[clamp(2.4rem,7vw,3.2rem)] leading-none"
            style={{ ...rise(head()), viewTransitionName: "workshop" }}
          >
            the workshop<span className="full-stop text-rose">.</span>
          </h1>

          <p className="lead rise mt-2" style={rise(head())}>
            {words(sum.hosts)} machines, {words(sum.services)} services,{" "}
            {sum.answering === sum.services
              ? "all answering."
              : `${words(sum.answering)} answering.`}
            {sum.off.length > 0 ? (
              <span className="text-muted">
                {" "}
                {sum.off.map((h) => h.id).join(", ")}{" "}
                {sum.off.length === 1 ? "is" : "are"} off, as usual.
              </span>
            ) : null}
          </p>

          <div className="mt-10 grid gap-x-6 gap-y-7 md:grid-cols-2">
            {fleet.hosts.map((host, i) => (
              <Panel
                delay={panels()}
                host={host}
                key={host.id}
                note={SCALE[i]}
                services={
                  fleet.services.filter((s) => s.host === host.id).length
                }
              />
            ))}
          </div>

          {/* The per-service table (name · blurb · memory · 30d · strip) was
              pulled in #56; the data still arrives in `fleet.services`. */}

          <footer className="rise mt-10 text-faint" style={rise(rows())}>
            <p>
              measured <Live>{(now) => ago(fleet.measuredAt, now)}</Live> ago
            </p>
          </footer>
        </div>
      </main>
    </NowProvider>
  );
}

function Panel({
  delay,
  host,
  note,
  services,
}: {
  delay: number;
  host: Host;
  note: number;
  services: number;
}) {
  const off = host.health === "off";
  const quiet = off || host.health === "down";
  const [os, ...spec] = host.spec.split(" · ");

  return (
    <article
      className="panel rise"
      data-health={host.health}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") sfx("tick", note);
      }}
      style={rise(delay)}
    >
      <h2 className="panel-title">
        <Lamp health={host.health} />
        {host.id}
      </h2>
      <p className="panel-role">{host.role}</p>
      <p className="mt-0.5 text-[11px] text-faint">
        {spec.length > 0 ? (
          <>
            <span className="max-sm:hidden">{os} · </span>
            {spec.join(" · ")}
          </>
        ) : (
          os
        )}
      </p>

      <div className="vitals mt-5">
        <Vital
          label="cpu"
          num={host.cpu}
          quiet={quiet}
          render={(v) => [String(Math.round(v)), "%"]}
          sub={
            quiet ? "—" : `load ${host.load.map((l) => l.toFixed(2)).join(" ")}`
          }
        >
          <Sparkline
            className={quiet ? "text-faint" : "text-rose"}
            data={host.cpuSpark}
            delay={delay + 200}
            max={100}
            scrub={
              quiet
                ? undefined
                : (v, ago) => `${v}% · ${ago === 0 ? "now" : `${ago}m ago`}`
            }
          />
        </Vital>
        <Vital
          label="memory"
          num={host.memUsed}
          quiet={quiet}
          render={(v) => [fmtMb(v), `${pct(v, host.memTotal)}%`]}
          sub={`of ${fmtMb(host.memTotal)}`}
        >
          <Gauge frac={host.memUsed / host.memTotal} />
        </Vital>
        <Vital
          label="disk"
          num={host.diskUsed}
          quiet={quiet}
          render={(v) => [fmtGb(v), `${pct(v, host.diskTotal)}%`]}
          sub={`of ${fmtGb(host.diskTotal)}`}
        >
          <Gauge frac={host.diskUsed / host.diskTotal} />
        </Vital>
      </div>

      <p className="panel-beat mt-4">
        <span className="k">heartbeat</span>
        <Strip
          cells={host.beats.slice(-30)}
          delay={delay + 300}
          end={host.lastSeen}
        />
        <span className="v">
          {quiet ? (
            host.health
          ) : (
            <Live>{(now) => `up ${fmtUptime(host.upSince, now)}`}</Live>
          )}
        </span>
      </p>

      <p className="panel-foot text-[11px]">
        <span className="max-sm:hidden">
          {services === 0
            ? "services private"
            : `${words(services)} ${services === 1 ? "service" : "services"}`}
          {" · "}
        </span>
        {host.containers > 0 ? `${host.containers} containers · ` : ""}
        <Live>
          {(now) => (
            <span
              className={
                !quiet && now - host.lastSeen <= 90_000
                  ? "text-rose"
                  : undefined
              }
            >
              {off ? "last seen" : "seen"} {ago(host.lastSeen, now)} ago
            </span>
          )}
        </Live>
      </p>
    </article>
  );
}

function Vital({
  children,
  label,
  num,
  quiet,
  render,
  sub,
}: {
  children: ReactNode;
  label: string;
  num: number;
  quiet: boolean;
  render: (v: number) => [string, string];
  sub: string;
}) {
  const { value: v, moving } = useTween(num);
  const [value, unit] = render(v);
  return (
    <div className="vital">
      <p className="vital-label">{label}</p>
      {quiet ? (
        <p className="vital-value">—</p>
      ) : (
        <p className="vital-value" data-moving={moving ? "" : undefined}>
          {value}
          <small>{unit}</small>
        </p>
      )}
      <div className="vital-bar">{children}</div>
      <p className="vital-sub">{sub}</p>
    </div>
  );
}
