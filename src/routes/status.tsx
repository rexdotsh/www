import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import BackLink from "@/components/back-link";
import { Pulse, Sparkline, Strip } from "@/components/fleet";
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

const TICK_MS = 4000;
const rise = (ms: number) => ({ animationDelay: `${ms}ms` }) as CSSProperties;

const agoS = (then: number, now: number) => {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s ago`;
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

// Nudge the live numbers so the mock breathes. Goes away with real data.
const breathe = (fleet: Fleet): Fleet => ({
  ...fleet,
  measuredAt: Date.now() - 800,
  sweep: clamp(fleet.sweep + Math.round((Math.random() - 0.5) * 90), 380, 940),
  hosts: fleet.hosts.map((h) => {
    if (h.health === "down") return h;
    const cpu = clamp(h.cpu + Math.round((Math.random() - 0.5) * 7), 1, 99);
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
      lastSeen: Date.now() - 800,
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

function StatusPage() {
  const { fleet: initial } = Route.useLoaderData();
  const { fleet, now } = useLiveFleet(initial);
  const sum = summarize(fleet);

  return (
    <main className="min-h-dvh paper px-7 py-14 font-serif-display text-ink selection:bg-rose selection:text-paper md:py-24">
      <div className="mx-auto w-full max-w-4xl">
        <BackLink className="rise font-mono text-muted text-xs" to="/">
          home
        </BackLink>

        <header className="mt-10 md:flex md:items-end md:justify-between md:gap-8">
          <h1
            className="rise text-[clamp(2.4rem,7vw,3.2rem)] leading-none"
            style={rise(80)}
          >
            the workshop<span className="full-stop text-rose">.</span>
          </h1>
          <p
            className="rise mt-3 font-mono text-[11px] text-faint italic tabular-nums md:mt-0 md:text-right"
            style={rise(150)}
          >
            <span className="swap-in" key={Math.floor(now / 1000)}>
              ( measured {agoS(fleet.measuredAt, now)} · sweep took{" "}
              {fleet.sweep}ms )
            </span>
          </p>
        </header>

        <Lead delay={230} fleet={fleet} sum={sum} />

        <Section delay={420} label="machines">
          {fleet.hosts.map((host, i) => (
            <HostPlate
              delay={500 + i * 90}
              host={host}
              key={host.id}
              now={now}
            />
          ))}
        </Section>

        <Section delay={900} label="what they run">
          <p
            className="rise mb-5 font-mono text-[11px] text-faint italic"
            style={rise(940)}
          >
            {sum.answering} of {sum.services} answering. each cell is one check,
            oldest on the left.
          </p>
          <div className="rise" style={rise(980)}>
            <div className="hidden grid-cols-[8.5rem_minmax(0,1fr)_4.5rem_22.5rem] gap-5 pb-2 font-mono text-[9px] text-faint uppercase tracking-[0.18em] md:grid">
              <span>service</span>
              <span>what it is</span>
              <span className="text-right">answer</span>
              <span>last 90 checks</span>
            </div>
            {fleet.services.map((service, i) => (
              <ServiceRow
                delay={1000 + i * 40}
                key={service.id}
                service={service}
              />
            ))}
          </div>
        </Section>

        <Section delay={1500} label="the log">
          <ol className="rise" style={rise(1540)}>
            {fleet.incidents.map((incident) => (
              <LogEntry
                incident={incident}
                key={`${incident.ts}-${incident.service}`}
                now={now}
              />
            ))}
          </ol>
        </Section>

        <footer
          className="rise mt-20 border-ink/10 border-t pt-6 font-mono text-[11px] text-faint"
          style={rise(1700)}
        >
          <p>
            the terminal version:{" "}
            <kbd className="cmd">curl rex.wf/status.txt</kbd>
          </p>
          <p className="mt-2 italic">
            ( shapes, not addresses. every machine reports in on its own;
            nothing here is reachable from this page. )
          </p>
        </footer>
      </div>
    </main>
  );
}

function Lead({
  delay,
  fleet,
  sum,
}: {
  delay: number;
  fleet: Fleet;
  sum: ReturnType<typeof summarize>;
}) {
  const asleep = fleet.hosts.filter((h) => h.health !== "up");
  const quietNames = sum.quiet.map((s) => s.name);

  return (
    <p className="prose-lead rise mt-10 max-w-3xl" style={rise(delay)}>
      {sum.awake === sum.hosts
        ? `all ${words(sum.hosts)} machines are awake`
        : `${words(sum.awake)} of ${words(sum.hosts)} machines are awake`}
      {", "}
      {sum.answering === sum.services ? (
        "everything is answering"
      ) : (
        <>
          {words(sum.answering)} of {words(sum.services)} things are answering
        </>
      )}
      {", and the loudest is "}
      <em>{sum.loud.id}</em>
      {` at ${sum.loud.cpu}% — ${loudNote(sum.loud)}`}
      {asleep.length > 0 ? (
        <>
          {" "}
          <em>{asleep.map((h) => h.id).join(" and ")}</em>
          {asleep.length === 1 ? " has " : " have "}
          gone quiet
          {quietNames.length > 0
            ? `, taking ${quietNames.join(" and ")} with it.`
            : "."}
        </>
      ) : null}
    </p>
  );
}

const loudNote = (host: Host) => {
  if (host.cpu > 70) return "something's rendering.";
  if (host.cpu > 30) return "someone's watching something.";
  return "which is to say, not very.";
};

function Section({
  children,
  delay,
  label,
}: {
  children: ReactNode;
  delay: number;
  label: string;
}) {
  return (
    <section className="mt-16">
      <div className="fleet-rule rise" style={rise(delay)}>
        <span className="fleet-tab">{label}</span>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function HostPlate({
  delay,
  host,
  now,
}: {
  delay: number;
  host: Host;
  now: number;
}) {
  const stale = now - host.lastSeen > 90_000;
  const memPct = pct(host.memUsed, host.memTotal);
  const diskPct = pct(host.diskUsed, host.diskTotal);
  return (
    <article
      className="host rise"
      data-health={host.health}
      style={rise(delay)}
    >
      <header>
        <h2 className="host-name flex items-baseline gap-3 text-[2.2rem] leading-none">
          <Pulse className="-translate-y-0.5" health={host.health} />
          {host.id}
        </h2>
        <p className="mt-2 font-serif-body text-[15px] text-muted italic">
          {host.role}
        </p>
        <p className="mt-2 font-mono text-[10px] text-faint leading-relaxed">
          {host.spec}
        </p>
        <p
          className={`mt-3 font-mono text-[10px] tabular-nums ${stale ? "text-rose" : "text-faint"}`}
        >
          <span className="swap-in" key={Math.floor(now / 1000)}>
            {stale ? "last seen " : "seen "}
            {agoS(host.lastSeen, now)}
          </span>
        </p>
      </header>

      <div className="vitals">
        <Vital
          label="cpu"
          sub={`load ${host.load.map((l) => l.toFixed(2)).join(" ")}`}
          unit="%"
          value={String(host.cpu)}
        >
          <Sparkline
            className="text-rose"
            data={host.cpuSpark}
            delay={delay + 200}
            max={100}
          />
        </Vital>
        <Vital
          label="memory"
          sub={`of ${fmtMb(host.memTotal)}${host.swapTotal > 0 ? ` · swap ${fmtMb(host.swapUsed)}` : ""}`}
          unit={`${memPct}%`}
          value={fmtMb(host.memUsed)}
        >
          <Sparkline
            className="text-ink"
            data={host.memSpark}
            delay={delay + 260}
            max={100}
          />
        </Vital>
        <Vital
          label="disk · 30d"
          sub={`of ${fmtGb(host.diskTotal)}`}
          unit={`${diskPct}%`}
          value={fmtGb(host.diskUsed)}
        >
          <Sparkline
            className="text-ink"
            data={host.diskTrend}
            delay={delay + 320}
            max={host.diskTotal}
          />
        </Vital>
        <Vital
          label="up"
          sub={
            host.containers > 0
              ? `${host.containers} containers · 90 heartbeats`
              : "no containers · 90 heartbeats"
          }
          value={host.health === "down" ? "no" : fmtUptime(host.upSince, now)}
        >
          <span className="block pt-[7px] pb-1.5">
            <Strip cells={host.beats} delay={delay + 380} />
          </span>
        </Vital>
      </div>
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
    <div>
      <p className="vital-label">{label}</p>
      <p className="vital-value mt-1.5">
        <span className="swap-in" key={value}>
          {value}
        </span>
        {unit ? <small>{unit}</small> : null}
      </p>
      <div className="mt-2">{children}</div>
      <p className="vital-sub mt-1.5">{sub}</p>
    </div>
  );
}

function ServiceRow({ delay, service }: { delay: number; service: Service }) {
  return (
    <div className="svc" data-health={service.health}>
      <p className="svc-name flex items-center gap-2.5 font-mono text-ink text-xs">
        <Pulse health={service.health} />
        {service.name}
      </p>
      <p className="svc-blurb leading-snug">
        <span className="block truncate font-serif-body text-[15px] text-muted italic">
          {service.blurb}
        </span>
        <span className="block truncate font-mono text-[10px] text-faint">
          for {service.who} · on {service.host}
        </span>
      </p>
      <p className="svc-lat text-right font-mono text-[11px] text-faint tabular-nums">
        {service.health === "down" ? "—" : `${service.latency}ms`}
      </p>
      <span className="svc-strip">
        <Strip cells={service.strip} delay={delay} />
      </span>
    </div>
  );
}

const DAY_MS = 86_400_000;
const dateLabel = (ts: number, now: number) => {
  const d = new Date(ts);
  const days = Math.floor((now - ts) / DAY_MS);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return d
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toLowerCase();
};

function LogEntry({ incident, now }: { incident: Incident; now: number }) {
  return (
    <li className="log-entry">
      <span className="font-mono text-[11px] text-faint tabular-nums">
        {dateLabel(incident.ts, now)}
      </span>
      <span className="font-serif-body text-[15px] text-muted leading-snug">
        <span className="font-mono text-ink text-xs not-italic">
          {incident.service}
        </span>{" "}
        <span className="italic">{incident.note}</span>{" "}
        <span className="whitespace-nowrap font-mono text-[10px] text-faint">
          {incident.resolved ? (
            `· ${fmtDuration(incident.duration)}`
          ) : (
            <span className="ongoing">ongoing</span>
          )}
        </span>
      </span>
    </li>
  );
}
