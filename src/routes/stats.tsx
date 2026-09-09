import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import BackLink from "@/components/back-link";
import {
  Columns,
  HeatGrid,
  RankList,
  Sparkline,
  Split,
} from "@/components/stats-charts";
import { preloadFont } from "@/lib/head";
import {
  CHOICES,
  COUNTRIES,
  DAILY_VISITORS,
  HOURS,
  LISTENING,
  LIVE,
  PAGES,
  POST_STATS,
  READ_DEPTH,
  REFERRERS,
  TOTALS,
  YEAR_HEAT,
} from "@/lib/mock-stats";
import newsreaderItalicWoff2 from "../fonts/newsreader-latin-italic.woff2?url";
import bodyCss from "../fonts-body.css?url";
import statsCss from "../stats.css?url";

const DESCRIPTION = "who reads this, from where, and when. public.";

export const Route = createFileRoute("/stats")({
  component: Stats,
  head: () => ({
    meta: [
      { title: "stats" },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "stats" },
      { property: "og:description", content: DESCRIPTION },
    ],
    links: [
      { rel: "stylesheet", href: bodyCss },
      { rel: "stylesheet", href: statsCss },
      preloadFont(newsreaderItalicWoff2),
    ],
  }),
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control":
      "public, max-age=300, stale-while-revalidate=3600",
  }),
});

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (n: number) => `${Math.round(n * 100)}%`;
const mins = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

const HEAT_LEGEND = [0, 1, 2, 3, 4];

function Section({
  children,
  cap,
  delay,
  title,
}: {
  children: ReactNode;
  cap: string;
  delay: number;
  title: string;
}) {
  return (
    <section
      className="stat-section rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="stat-h">
        {title}
        <span className="text-rose">.</span>
      </h2>
      <p className="stat-cap">{cap}</p>
      {children}
    </section>
  );
}

function Stats() {
  return (
    <main className="min-h-dvh paper px-7 py-14 font-serif-display text-ink selection:bg-rose selection:text-paper md:py-24">
      <div className="mx-auto w-full max-w-xl">
        <BackLink className="rise font-mono text-muted text-xs" to="/">
          home
        </BackLink>

        <h1
          className="rise mt-10 text-[clamp(2.4rem,7vw,3.2rem)] leading-none"
          style={{ animationDelay: "80ms" }}
        >
          stats<span className="full-stop text-rose">.</span>
        </h1>
        <p
          className="rise mt-3 font-mono text-faint text-[11px] italic"
          style={{ animationDelay: "150ms" }}
        >
          ( public. honest. mock numbers, for now. )
        </p>

        <Section cap="( refreshes itself )" delay={230} title="right now">
          <p className="mt-6 font-mono text-ink text-sm">
            <span className="live-dot" />
            {LIVE.length} people here
          </p>
          <ul className="live-list">
            {LIVE.map((reader) => (
              <li className="live-row" key={reader.place}>
                <span className="live-place">{reader.place}</span>
                <span className="live-page">{reader.page}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          cap="( unique-ish. umami hashes, no cookies. )"
          delay={300}
          title="thirty days"
        >
          <div className="figures">
            <Figure
              delta={`+${pct(TOTALS.deltaVisitors)}`}
              label="visitors"
              n={fmt(TOTALS.visitors)}
            />
            <Figure label="pageviews" n={fmt(TOTALS.views)} />
            <Figure label="avg. stay" n={mins(TOTALS.avgSeconds)} />
            <Figure label="left at once" n={pct(TOTALS.bounce)} />
          </div>
          <Sparkline
            annotate={{
              index: DAILY_VISITORS.length - 10,
              label: "hacker news",
            }}
            values={DAILY_VISITORS}
          />
          <div className="spark-axis">
            <span>30 days ago</span>
            <span>today</span>
          </div>
        </Section>

        <Section
          cap="( same shape as the github one, but for you. )"
          delay={370}
          title="a year of visits"
        >
          <HeatGrid weeks={YEAR_HEAT} />
          <div className="heat-legend">
            <i>quiet</i>
            {HEAT_LEGEND.map((level) => (
              <span
                key={level}
                style={{ backgroundColor: `var(--heat-${level})` }}
              />
            ))}
            <i>loud</i>
          </div>
          <p className="stat-note mt-5">
            the dark stripe in november is the <em>parabox</em> post landing on
            hacker news. the quiet summer is me, not you.
          </p>
        </Section>

        <Section cap="( by country, not by person. )" delay={440} title="where">
          <RankList items={COUNTRIES} />
        </Section>

        <Section cap="( how you got here. )" delay={510} title="from">
          <RankList delay={60} items={REFERRERS} />
        </Section>

        <Section
          cap="( pageviews, then how far you got. )"
          delay={580}
          title="what gets read"
        >
          <RankList format={fmt} items={PAGES} />
          <p className="stat-note mt-8">
            for the one post that exists, how far readers scroll before leaving:
          </p>
          <Columns
            highlight={READ_DEPTH.length - 1}
            label="reading depth by decile"
            ticks={
              <>
                <span>top</span>
                <span>half</span>
                <span>end</span>
              </>
            }
            values={READ_DEPTH}
          />
          <p className="stat-cap">
            {pct(POST_STATS.finished)} make it to the end. median{" "}
            {POST_STATS.medianMinutes} minutes.
          </p>

          <p className="stat-note mt-8">
            — and what this could look like under a post:
          </p>
          <div className="readership">
            <span>
              read <b>{fmt(POST_STATS.reads)}</b> times
            </span>
            <span className="sep">·</span>
            <span>
              <b>{pct(POST_STATS.finished)}</b> finished
            </span>
            <span className="sep">·</span>
            <span>
              median <b>{POST_STATS.medianMinutes}m</b>
            </span>
            <span className="sep">·</span>
            <span>
              <b>{LIVE.filter((r) => r.page.includes("parabox")).length}</b>{" "}
              reading now
            </span>
          </div>
        </Section>

        <Section cap="( your local hour, not mine. )" delay={650} title="when">
          <Columns
            highlight={HOURS.indexOf(Math.max(...HOURS))}
            label="visits by hour of day"
            ticks={
              <>
                <span>00</span>
                <span>06</span>
                <span>12</span>
                <span>18</span>
                <span>23</span>
              </>
            }
            values={HOURS}
          />
          <p className="stat-note mt-5">
            peak at <em>11pm</em>. of course.
          </p>
        </Section>

        <Section
          cap="( first-party. the toggles on this site. )"
          delay={720}
          title="how"
        >
          <Split a="phone" b="desktop" ratio={CHOICES.phone} />
          <Split a="dark" b="light" ratio={CHOICES.dark} />
          <p className="choices">
            <b>{pct(CHOICES.soundOn)}</b> of you turned the sound on.{" "}
            <b>{pct(CHOICES.playedPreview)}</b> pressed play on a song.{" "}
            <em>{CHOICES.copiedEmail}</em> of you copied my email this month.
            say hi.
          </p>
        </Section>

        <Section
          cap="( mine, not yours. spotify, this month. )"
          delay={790}
          title="listening"
        >
          <div className="figures">
            <Figure label="hours" n={String(LISTENING.hours)} />
            <Figure label="most played" n={LISTENING.topArtist} />
          </div>
          <ol className="tracks">
            {LISTENING.tracks.map((track, i) => (
              <li
                className="track"
                key={track.name}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <span className="track-i">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="track-n">{track.name}</span>
                  <span className="track-a"> — {track.artist}</span>
                </span>
                <span className="track-p">×{track.plays}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          cap="( everything i can see about you. that's the list. )"
          delay={860}
          title="you"
        >
          <Mirror />
        </Section>

        <footer
          className="rise mt-16 border-ink/10 border-t pt-6"
          style={{ animationDelay: "930ms" }}
        >
          <p className="font-mono text-faint text-[11px] italic">
            counted by umami, self-hosted. no cookies, no fingerprinting, no
            third parties. numbers above are made up until they aren't.
          </p>
        </footer>
      </div>
    </main>
  );
}

function Figure({
  delta,
  label,
  n,
}: {
  delta?: string;
  label: string;
  n: string;
}) {
  return (
    <div>
      <span className="figure-n">
        {n}
        {delta ? <small className="figure-d">{delta}</small> : null}
      </span>
      <span className="figure-l">{label}</span>
    </div>
  );
}

// The "mirror": what a request actually reveals. Read live on the client so
// the visitor sees their own values, not mine.
interface Seen {
  browser: string;
  language: string;
  os: string;
  referrer: string;
  screen: string;
  theme: string;
  time: string;
  zone: string;
}

const detect = (ua: string, pairs: [RegExp, string][]) =>
  pairs.find(([re]) => re.test(ua))?.[1] ?? "something";

const BROWSERS: [RegExp, string][] = [
  [/edg\//i, "edge"],
  [/firefox/i, "firefox"],
  [/chrome|crios/i, "chrome"],
  [/safari/i, "safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iphone|ipad/i, "ios"],
  [/android/i, "android"],
  [/mac os/i, "macos"],
  [/windows/i, "windows"],
  [/linux/i, "linux"],
];

function Mirror() {
  const [seen, setSeen] = useState<Seen | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());
    let referrer = "";
    try {
      referrer = document.referrer ? new URL(document.referrer).hostname : "";
    } catch {
      referrer = "";
    }
    setSeen({
      browser: detect(ua, BROWSERS),
      os: detect(ua, SYSTEMS),
      screen: `${window.innerWidth}×${window.innerHeight}`,
      zone: zone.replaceAll("_", " ").toLowerCase(),
      time: time.toLowerCase(),
      theme:
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      referrer,
      language: navigator.language.toLowerCase(),
    });
  }, []);

  const rows: [string, string | undefined][] = [
    ["browser", seen?.browser],
    ["system", seen?.os],
    ["viewport", seen?.screen],
    ["timezone", seen?.zone],
    ["your clock", seen?.time],
    ["theme", seen?.theme],
    ["language", seen?.language],
    ["came from", seen ? seen.referrer || "nowhere. typed it." : undefined],
  ];

  return (
    <div className="mirror">
      {rows.map(([k, v]) => (
        <div className="mirror-row" key={k}>
          <span className="mirror-k">{k}</span>
          <span className="mirror-v" data-empty={v ? undefined : ""}>
            {v ?? "…"}
          </span>
        </div>
      ))}
      <p className="mirror-foot">
        no ip stored. no id. umami hashes your visit and forgets it at midnight.
      </p>
    </div>
  );
}
