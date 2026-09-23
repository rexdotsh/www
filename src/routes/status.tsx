import { createFileRoute } from "@tanstack/react-router";
import { fleet } from "@/server/fleet-auth";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
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
  type Service,
  summarize,
} from "@/lib/fleet";
import { preloadFont } from "@/lib/head";
import newsreaderItalicWoff2 from "../fonts/newsreader-latin-italic.woff2?url";
import bodyCss from "../fonts-body.css?url";
import statusCss from "../status.css?url";

const DESCRIPTION = "four machines and what they run.";

export const Route = createFileRoute("/status")({
  component: StatusPage,
  loader: async () => {
    const stub = fleet();
    if (!stub) {
      return { fleet: mockFleet(Date.now()) };
    }
    // RPC results carry Symbol.dispose and widen tuples; the DO built a real Fleet.
    const { hosts, services, measuredAt } = await stub.snapshot();
    return { fleet: { hosts, services, measuredAt } as Fleet };
  },
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

const utc = (ts: number) => `${new Date(ts).toISOString().slice(11, 19)} utc`;

// Locally the mock just wobbles; deployed, the page polls the snapshot.
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
  const [now, setNow] = useState(initial.measuredAt + 12_000);
  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (initial.mock) return setFleet(wobble);
      fetch("/api/fleet")
        .then((r) => (r.ok ? (r.json() as Promise<Fleet>) : null))
        .then((f) => f && setFleet(f))
        .catch(() => undefined);
    }, TICK_MS);
    return () => {
      clearInterval(clock);
      clearInterval(tick);
    };
  }, [initial.mock]);
  return { fleet, now };
}

const stagger = (start: number, step: number) => {
  let n = 0;
  return () => {
    const style = { animationDelay: `${start + n * step}ms` } as CSSProperties;
    n += 1;
    return style;
  };
};

function StatusPage() {
  const { fleet: initial } = Route.useLoaderData();
  const { fleet, now } = useLiveFleet(initial);
  const sum = summarize(fleet);
  const head = stagger(0, 70);
  const panels = stagger(320, 100);
  const rows = stagger(780, 30);

  return (
    <main className="min-h-dvh paper px-7 py-14 text-ink selection:bg-rose selection:text-paper md:py-20">
      <div className="tty mx-auto w-full max-w-4xl">
        <BackLink className="rise text-muted text-xs" style={head()} to="/">
          home
        </BackLink>

        <header className="mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1
            className="rise font-serif-display text-[clamp(2.4rem,7vw,3.2rem)] leading-none"
            style={{ ...head(), viewTransitionName: "workshop" }}
          >
            the workshop<span className="full-stop text-rose">.</span>
          </h1>
          <p className="rise text-faint" style={head()}>
            {utc(now)}
          </p>
        </header>

        <p className="lead rise mt-2" style={head()}>
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

        <div className="panels mt-10 grid gap-x-6 gap-y-7 md:grid-cols-2">
          {fleet.hosts.map((host) => (
            <Panel
              host={host}
              key={host.id}
              now={now}
              services={fleet.services.filter((s) => s.host === host.id).length}
              style={panels()}
            />
          ))}
        </div>

        <div className="svc-head rise mt-12" style={rows()}>
          <span />
          <span />
          <span className="text-right">memory</span>
          <span className="text-right">30d</span>
          <span>last 45 checks</span>
        </div>
        {fleet.services.map((service) => (
          <ServiceRow key={service.id} service={service} style={rows()} />
        ))}

        <footer className="rise mt-10 text-faint" style={rows()}>
          <p>measured {ago(fleet.measuredAt, now)} ago</p>
        </footer>
      </div>
    </main>
  );
}

function Panel({
  host,
  now,
  services,
  style,
}: {
  host: Host;
  now: number;
  services: number;
  style: CSSProperties;
}) {
  const off = host.health === "off";
  const down = host.health === "down";
  const quiet = off || down;
  const stale = !quiet && now - host.lastSeen > 90_000;
  const delay = Number.parseInt(String(style.animationDelay), 10) || 0;

  return (
    <article className="panel rise" data-health={host.health} style={style}>
      <h2 className="panel-title">
        <Lamp health={host.health} />
        {host.id}
      </h2>
      <p className="panel-role">{host.role}</p>
      <p className="mt-0.5 text-[11px] text-faint">{host.spec}</p>

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
        <Strip cells={host.beats.slice(-30)} delay={delay + 300} />
        <span className="v">
          {off ? "off" : down ? "down" : `up ${fmtUptime(host.upSince, now)}`}
        </span>
      </p>

      <p className="panel-foot text-[11px]">
        {services === 0
          ? "services private"
          : `${words(services)} ${services === 1 ? "service" : "services"}`}
        {host.containers > 0 ? ` · ${host.containers} containers` : ""}
        {" · "}
        <span className={stale ? "text-rose" : undefined}>
          {off ? "last seen" : "seen"} {ago(host.lastSeen, now)} ago
        </span>
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
  const v = useTween(num);
  const [value, unit] = render(v);
  return (
    <div className="vital">
      <p className="vital-label">{label}</p>
      {quiet ? (
        <p className="vital-value">—</p>
      ) : (
        <p className="vital-value">
          {value}
          <small>{unit}</small>
        </p>
      )}
      <div className="vital-bar">{children}</div>
      <p className="vital-sub">{sub}</p>
    </div>
  );
}

function ServiceRow({
  service,
  style,
}: {
  service: Service;
  style: CSSProperties;
}) {
  const off = service.health === "off";
  const delay = Number.parseInt(String(style.animationDelay), 10) || 0;
  return (
    <div className="svc rise" data-health={service.health} style={style}>
      <p className="svc-name">
        <Lamp health={service.health} />
        {service.id}
      </p>
      <p className="svc-blurb">{service.blurb}</p>
      <p className="svc-lat">
        {service.health === "up" ? fmtMb(service.mem) : "—"}
      </p>
      <p className="svc-pct">{off ? "—" : `${service.uptime30.toFixed(1)}%`}</p>
      <span className="svc-strip">
        <Strip cells={service.strip.slice(-45)} delay={delay + 200} />
      </span>
    </div>
  );
}
