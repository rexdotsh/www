import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import BackLink from "@/components/back-link";
import { Cursor, Gauge, Lamp, Sparkline, Strip } from "@/components/fleet";
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

const WORDS = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];
const words = (n: number) => WORDS[n] ?? String(n);

const TICK_MS = 2500;
const LINE_MS = 28;

const agoS = (then: number, now: number) => {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
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
  const down = fleet.hosts.filter((h) => h.health !== "up");

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

        <p className="lead tty-line mt-4" style={line()}>
          {words(sum.hosts)} machines, {words(sum.services)} services,{" "}
          {sum.answering === sum.services
            ? "all answering."
            : `${words(sum.answering)} answering.`}
          {down.length > 0 ? (
            <>
              {" "}
              <em>{down.map((h) => h.id).join(", ")}</em>{" "}
              {down.length === 1 ? "is" : "are"} down.
            </>
          ) : null}
        </p>

        <Rule label="machines" style={line(200)} />
        <div className="mt-8 grid gap-x-6 gap-y-8 md:grid-cols-2">
          {fleet.hosts.map((host) => (
            <Panel host={host} key={host.id} now={now} style={line(200)} />
          ))}
        </div>

        <Rule label="services" style={line(400)} />
        <div className="svc-head tty-line mt-6" style={line(400)}>
          <span>service</span>
          <span />
          <span className="text-right">answer</span>
          <span className="text-right">30d</span>
          <span>last 45 checks</span>
        </div>
        {fleet.services.map((service) => (
          <ServiceRow key={service.id} service={service} style={line(400)} />
        ))}

        <footer className="tty-line mt-14 text-faint" style={line(700)}>
          <p>
            measured {agoS(fleet.measuredAt, now)} ago · {fleet.sweep}ms
          </p>
        </footer>
      </div>
    </main>
  );
}

function Rule({ label, style }: { label: string; style: CSSProperties }) {
  return (
    <p className="tty-rule tty-line mt-14" style={style}>
      <b>{label}</b>
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
        <Lamp health={host.health} />
        {host.id}
      </h2>
      <p className="panel-role">{host.role}</p>
      <p className="mt-0.5 text-[11px] text-faint">{host.spec}</p>

      <div className="vitals mt-5">
        <Vital
          label="cpu"
          sub={`load ${host.load.map((l) => l.toFixed(2)).join(" ")}`}
          unit="%"
          value={String(host.cpu)}
        >
          <Sparkline
            className={down ? "text-faint" : "text-rose"}
            data={host.cpuSpark}
            delay={300}
            max={100}
          />
        </Vital>
        <Vital
          label="memory"
          sub={`of ${fmtMb(host.memTotal)}`}
          unit={`${pct(host.memUsed, host.memTotal)}%`}
          value={fmtMb(host.memUsed)}
        >
          <Gauge frac={host.memUsed / host.memTotal} />
        </Vital>
        <Vital
          label="disk"
          sub={`of ${fmtGb(host.diskTotal)}`}
          unit={`${pct(host.diskUsed, host.diskTotal)}%`}
          value={fmtGb(host.diskUsed)}
        >
          <Gauge frac={host.diskUsed / host.diskTotal} />
        </Vital>
      </div>

      <p className="panel-beat mt-4">
        <span className="k">heartbeat</span>
        <Strip cells={host.beats.slice(-30)} delay={400} />
        <span className="v">
          {down ? "down" : `up ${fmtUptime(host.upSince, now)}`}
        </span>
      </p>

      <p className="panel-foot text-[11px]">
        {host.containers > 0 ? `${host.containers} containers · ` : ""}
        <span className={stale ? "text-rose" : undefined}>
          seen {agoS(host.lastSeen, now)} ago
        </span>
      </p>
    </article>
  );
}

function Vital({
  children,
  label,
  sub,
  unit,
  value,
}: {
  children: ReactNode;
  label: string;
  sub: string;
  unit?: string;
  value: string;
}) {
  return (
    <div className="vital">
      <p className="vital-label">{label}</p>
      <p className="vital-value">
        <span className="swap-in" key={value}>
          {value}
        </span>
        {unit ? <small>{unit}</small> : null}
      </p>
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
  return (
    <div className="svc tty-line" data-health={service.health} style={style}>
      <p className="svc-name">
        <Lamp health={service.health} />
        {service.name}
      </p>
      <p className="svc-blurb">{service.blurb}</p>
      <p className="svc-lat">
        {service.health === "down" ? "—" : `${service.latency}ms`}
      </p>
      <p className="svc-pct">{service.uptime30.toFixed(1)}%</p>
      <span className="svc-strip">
        <Strip cells={service.strip.slice(-45)} delay={500} />
      </span>
    </div>
  );
}
