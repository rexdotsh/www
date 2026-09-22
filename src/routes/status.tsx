import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import BackLink from "@/components/back-link";
import { Bars, Cursor, Gauge, Seismo } from "@/components/fleet";
import {
  type Fleet,
  fmtDuration,
  fmtGb,
  fmtMb,
  fmtUptime,
  type Host,
  type Incident,
  mockFleet,
  pct,
  type Service,
  summarize,
} from "@/lib/fleet";
import { preloadFont } from "@/lib/head";
import newsreaderItalicWoff2 from "../fonts/newsreader-latin-italic.woff2?url";
import bodyCss from "../fonts-body.css?url";
import statusCss from "../status.css?url";

const DESCRIPTION =
  "four machines, the things they run for friends, and whether they're answering.";

export const Route = createFileRoute("/status")({
  component: StatusPage,
  // Mock for now. Seeded from the server clock so SSR and hydration agree.
  loader: () => ({ fleet: mockFleet(Date.now()) }),
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

const TICK_MS = 2500;
const LINE_MS = 28;

const agoS = (then: number, now: number) => {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s ago`;
};

const utc = (ts: number) => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} utc`;
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

// Nudge the live numbers so the mock breathes. Goes away with real data.
const breathe = (fleet: Fleet): Fleet => ({
  ...fleet,
  measuredAt: Date.now() - 600,
  sweep: clamp(fleet.sweep + Math.round((Math.random() - 0.5) * 90), 380, 940),
  hosts: fleet.hosts.map((h) => {
    if (h.health === "down") return h;
    const cpu = clamp(h.cpu + Math.round((Math.random() - 0.5) * 9), 1, 99);
    const mem = clamp(
      h.memUsed + Math.round((Math.random() - 0.5) * h.memTotal * 0.01),
      0,
      h.memTotal
    );
    return {
      ...h,
      cpu,
      memUsed: mem,
      cpuSpark: [...h.cpuSpark.slice(1), cpu],
      memSpark: [...h.memSpark.slice(1), pct(mem, h.memTotal)],
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
      if (document.visibilityState === "visible") {
        setFleet(breathe);
      }
    }, TICK_MS);
    return () => {
      clearInterval(clock);
      clearInterval(tick);
    };
  }, []);

  return { fleet, now };
}

// Blocks print top to bottom, one after another.
const printer = () => {
  let n = 0;
  return (extra = 0) => {
    n += 1;
    return { animationDelay: `${n * LINE_MS + extra}ms` } as CSSProperties;
  };
};

function StatusPage() {
  const { fleet: initial } = Route.useLoaderData();
  const { fleet, now } = useLiveFleet(initial);
  const sum = summarize(fleet);
  const line = printer();

  return (
    <main className="min-h-dvh paper px-7 py-14 text-ink selection:bg-rose selection:text-paper md:py-20">
      <div className="tty mx-auto w-full max-w-4xl">
        <BackLink className="tty-line text-muted text-xs" style={line()} to="/">
          home
        </BackLink>

        <div
          className="tty-line mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1"
          style={line()}
        >
          <p>
            <span className="prompt">$</span> curl rex.wf/status
          </p>
          <p className="text-faint">
            {utc(now)} <Cursor />
          </p>
        </div>

        <h1
          className="tty-line mt-6 font-serif-display text-[clamp(2.4rem,7vw,3.2rem)] leading-none"
          style={line()}
        >
          the workshop<span className="full-stop text-rose">.</span>
        </h1>

        <Lead fleet={fleet} style={line()} sum={sum} />

        <Rule label="machines" style={line(200)} />
        <div className="mt-8 grid gap-x-6 gap-y-8 md:grid-cols-2">
          {fleet.hosts.map((host) => (
            <Panel host={host} key={host.id} now={now} style={line(200)} />
          ))}
        </div>

        <Rule label="what they run" style={line(400)} />
        <p className="tty-line mt-5 mb-4 text-faint" style={line(400)}>
          {sum.answering} of {sum.services} answering. each glyph is one check
          from outside; flat is good.
        </p>
        <div className="svc-head tty-line" style={line(400)}>
          <span>service</span>
          <span>what it is · for whom</span>
          <span className="text-right">answer</span>
          <span>last 45 checks</span>
        </div>
        {fleet.services.map((service) => (
          <ServiceRow key={service.id} service={service} style={line(400)} />
        ))}

        <Rule label="the log" style={line(700)} />
        <ol className="log tty-line mt-6" style={line(700)}>
          {fleet.incidents.map((incident) => (
            <LogEntry
              incident={incident}
              key={`${incident.ts}-${incident.service}`}
              now={now}
            />
          ))}
        </ol>

        <Rule style={line(900)} />
        <footer className="tty-line mt-6 text-faint" style={line(900)}>
          <p>
            measured {agoS(fleet.measuredAt, now)} · sweep took {fleet.sweep}
            ms · every machine reports in on its own; nothing here is reachable
            from this page.
          </p>
          <p className="mt-1">
            this is also exactly what <kbd className="cmd">curl</kbd> prints. in
            colour, though.
          </p>
          <p className="mt-8">
            <span className="prompt">$</span> <Cursor />
          </p>
        </footer>
      </div>
    </main>
  );
}

function Lead({
  fleet,
  style,
  sum,
}: {
  fleet: Fleet;
  style: CSSProperties;
  sum: ReturnType<typeof summarize>;
}) {
  const asleep = fleet.hosts.filter((h) => h.health !== "up");
  const quiet = sum.quiet.map((s) => s.name);
  return (
    <p className="lead tty-line mt-5 max-w-2xl" style={style}>
      {sum.awake === sum.hosts
        ? `all ${sum.hosts} machines awake. `
        : `${sum.awake} of ${sum.hosts} machines awake. `}
      {sum.answering === sum.services
        ? "everything answering. "
        : `${sum.answering} of ${sum.services} things answering. `}
      <b>{sum.loud.id}</b> is loud ({sum.loud.cpu}%)
      {asleep.length > 0 ? (
        <>
          {", "}
          <b>{asleep.map((h) => h.id).join(", ")}</b>
          {asleep.length === 1 ? " has" : " have"} gone quiet
          {quiet.length > 0 ? `, taking ${quiet.join(" and ")} along.` : "."}
        </>
      ) : (
        "."
      )}
    </p>
  );
}

function Rule({ label, style }: { label?: string; style: CSSProperties }) {
  return (
    <p className="tty-rule tty-line mt-14" style={style}>
      {label ? <b>{label}</b> : null}
    </p>
  );
}

function Panel({
  host,
  now,
  style,
}: {
  host: Host;
  now: number;
  style: CSSProperties;
}) {
  const stale = now - host.lastSeen > 90_000;
  const down = host.health === "down";
  return (
    <article className="panel tty-line" data-health={host.health} style={style}>
      <h2 className="panel-title">
        <i className="lamp" data-health={host.health} />
        {host.id}
      </h2>
      <p className="panel-role">{host.role}</p>
      <p className="mt-0.5 text-[11px] text-faint">{host.spec}</p>

      <div className="mt-3.5 space-y-0.5">
        <Row k="cpu" v={`${host.cpu}%`}>
          <Bars className="trim" data={host.cpuSpark} max={100} width={24} />
        </Row>
        <Row
          k="mem"
          v={
            <>
              {fmtMb(host.memUsed)} <small>/ {fmtMb(host.memTotal)}</small>
            </>
          }
        >
          <Gauge frac={host.memUsed / host.memTotal} width={16} />
        </Row>
        <Row
          k="disk"
          v={
            <>
              {fmtGb(host.diskUsed)} <small>/ {fmtGb(host.diskTotal)}</small>
            </>
          }
        >
          <Gauge frac={host.diskUsed / host.diskTotal} width={16} />
        </Row>
        <Row k="beat" v={down ? "down" : `up ${fmtUptime(host.upSince, now)}`}>
          <span className="trim">
            <Seismo cells={host.beats.slice(-24)} delay={400} />
          </span>
        </Row>
      </div>

      <p className="panel-foot text-[11px]">
        load {host.load.map((l) => l.toFixed(2)).join(" ")}
        {host.containers > 0 ? ` · ${host.containers} containers` : ""}
        {" · "}
        <span className={stale ? "text-rose" : undefined}>
          seen {agoS(host.lastSeen, now)}
        </span>
      </p>
    </article>
  );
}

function Row({
  children,
  k,
  v,
}: {
  children: ReactNode;
  k: string;
  v: ReactNode;
}) {
  return (
    <p className="panel-row">
      <span className="k">{k}</span>
      <span>{children}</span>
      <span className="v">{v}</span>
    </p>
  );
}

function ServiceRow({
  service,
  style,
}: {
  service: Service;
  style: CSSProperties;
}) {
  return (
    <div className="svc tty-line" data-health={service.health} style={style}>
      <p className="svc-name">
        <i className="lamp" data-health={service.health} />
        {service.name}
      </p>
      <p className="svc-blurb">
        <span className="what">{service.blurb}</span>
        <span className="who">
          for {service.who} · on {service.host}
        </span>
      </p>
      <p className="svc-lat">
        <span className="block">
          {service.health === "down" ? "—" : `${service.latency}ms`}
        </span>
        <span className="pct block">{service.uptime30.toFixed(2)}%</span>
      </p>
      <p className="svc-strip">
        <Seismo cells={service.strip.slice(-45)} delay={600} />
      </p>
    </div>
  );
}

const DAY_MS = 86_400_000;
const dateLabel = (ts: number, now: number) => {
  const days = Math.floor((now - ts) / DAY_MS);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return new Date(ts)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    .toLowerCase();
};

function LogEntry({ incident, now }: { incident: Incident; now: number }) {
  return (
    <li className="contents">
      <span className="when">{dateLabel(incident.ts, now)}</span>
      <span className="who">{incident.service}</span>
      <span className="note">
        {incident.note}{" "}
        <span className="dur">
          {incident.resolved ? (
            `· ${fmtDuration(incident.duration)}`
          ) : (
            <span className="ongoing">· ongoing</span>
          )}
        </span>
      </span>
    </li>
  );
}
