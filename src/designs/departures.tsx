import { useEffect, useState } from "react";
import { getIdentity, getNavLinks, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

const AMBER = "#ffb52e";
const BONE = "#efe9dc";

/**
 * design 6 — "departures"
 * a split-flap board. every row flips into place like a station
 * announcement; the whole site is one big timetable.
 */
export default function DeparturesDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();

  return (
    <main className="min-h-dvh bg-[#e8e2d5] px-4 py-10 font-mono md:px-6 md:py-16">
      <div className="mx-auto w-full max-w-3xl">
        {/* station sign */}
        <header className="rise flex items-baseline justify-between px-1 text-[#5c564a]">
          <h1 className="text-[11px] uppercase tracking-[0.35em]">
            {identity.name} international — {identity.tagline}
          </h1>
          <span className="hidden text-[11px] tracking-[0.2em] md:block">
            terminal 1
          </span>
        </header>

        {/* the board */}
        <div
          className="rise mt-3 overflow-hidden rounded-lg bg-[#141412] shadow-[0_24px_60px_-24px_rgba(20,20,18,0.55)]"
          style={{ animationDelay: "80ms" }}
        >
          {/* board header */}
          <div className="flex items-center justify-between border-[#2a2a27] border-b px-5 py-4">
            <FlapText
              base={100}
              className="font-bold text-lg md:text-xl"
              color={BONE}
              text="DEPARTURES"
            />
            <BoardClock />
          </div>

          <div className="overflow-x-auto px-5 pb-6">
            <div className="min-w-[560px]">
              {/* destinations */}
              <ColumnHeads cols={["time", "destination", "gate", "status"]} />
              {links.map(({ href, label }, index) => (
                <a
                  className="group flex items-center gap-4 rounded px-2 py-2 transition-colors duration-100 hover:bg-white/[0.04]"
                  href={href}
                  key={href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <FlapText
                    base={400 + index * 120}
                    className="w-20 text-sm"
                    color={BONE}
                    text="NOW"
                  />
                  <FlapText
                    base={460 + index * 120}
                    className="flex-1 text-sm"
                    color={BONE}
                    text={label.toUpperCase().padEnd(14, " ")}
                  />
                  <FlapText
                    base={520 + index * 120}
                    className="w-16 text-sm"
                    color={BONE}
                    text={`0${index + 1}`}
                  />
                  <FlapText
                    base={560 + index * 120}
                    className="w-32 text-sm"
                    color={AMBER}
                    text="BOARDING"
                  />
                </a>
              ))}

              {/* services */}
              <SectionRule label="services — selected work" />
              <ColumnHeads cols={["year", "service", "carrier", "status"]} />
              {PROJECTS.map((project, index) => (
                <a
                  className="group flex items-center gap-4 rounded px-2 py-2 transition-colors duration-100 hover:bg-white/[0.04]"
                  href={project.href}
                  key={project.name}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <FlapText
                    base={900 + index * 90}
                    className="w-20 text-sm"
                    color={BONE}
                    text={project.year}
                  />
                  <FlapText
                    base={940 + index * 90}
                    className="flex-1 text-sm"
                    color={BONE}
                    text={project.name.toUpperCase().padEnd(16, " ")}
                  />
                  <span className="w-24 truncate text-[#6f6a5e] text-xs uppercase">
                    {project.language}
                  </span>
                  <FlapText
                    base={1000 + index * 90}
                    className="w-32 text-sm"
                    color={AMBER}
                    text={project.name === "www" ? "AT GATE" : "SHIPPED"}
                  />
                </a>
              ))}

              {/* arrivals */}
              <SectionRule label="arrivals — writing" />
              <ColumnHeads cols={["date", "title", "", "status"]} />
              {POSTS.map((post, index) => (
                <a
                  className="group flex items-center gap-4 rounded px-2 py-2 transition-colors duration-100 hover:bg-white/[0.04]"
                  href={post.href}
                  key={post.title}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <FlapText
                    base={1600 + index * 90}
                    className="w-24 text-sm"
                    color={BONE}
                    text={post.date}
                  />
                  <span className="min-w-0 flex-1 truncate text-[#d8d2c4] text-sm lowercase">
                    {post.title}
                  </span>
                  <FlapText
                    base={1660 + index * 90}
                    className="w-32 text-sm"
                    color={AMBER}
                    text={index === 0 ? "LANDED" : "ARCHIVED"}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* PA strip */}
          <div className="border-[#2a2a27] border-t px-5 py-3">
            <p className="truncate text-[#8f897b] text-xs tracking-[0.15em]">
              {track
                ? `♫ now announcing: ${track.artist} — ${track.name}`
                : "♫ the station is quiet right now"}
            </p>
          </div>
        </div>

        <footer
          className="rise mt-4 flex items-center justify-between px-1 text-[#8f897b] text-[11px] tracking-[0.2em]"
          style={{ animationDelay: "200ms" }}
        >
          <span>© {new Date().getFullYear()} — all departures final</span>
          <span className="hidden md:block">mind the gap</span>
        </footer>
      </div>
    </main>
  );
}

function FlapText({
  base,
  className = "",
  color,
  text,
}: {
  base: number;
  className?: string;
  color: string;
  text: string;
}) {
  return (
    <span
      className={`inline-flex gap-[2px] [perspective:400px] ${className}`}
      style={{ color }}
    >
      {text.split("").map((ch, index) => (
        <span
          className="flap h-[1.55em] w-[1.15ch] text-center"
          key={`${index}-${ch}`}
          style={{ animationDelay: `${base + index * 26}ms` }}
        >
          {ch.replace(" ", "\u00A0")}
        </span>
      ))}
    </span>
  );
}

function ColumnHeads({ cols }: { cols: string[] }) {
  const widths = ["w-20", "flex-1", "w-16", "w-32"];
  return (
    <div className="mt-3 flex items-center gap-4 px-2 pb-1 text-[#6f6a5e] text-[10px] uppercase tracking-[0.3em]">
      {cols.map((col, index) => (
        <span
          className={index === 1 ? "flex-1" : (widths[index] ?? "w-20")}
          key={col || index}
        >
          {col}
        </span>
      ))}
    </div>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="mt-6 flex items-center gap-3 px-2">
      <span className="text-[#6f6a5e] text-[10px] uppercase tracking-[0.3em]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[#2a2a27]" />
    </div>
  );
}

function BoardClock() {
  const [time, setTime] = useState<{ hh: string; mm: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({
        hh: String(now.getHours()).padStart(2, "0"),
        mm: String(now.getMinutes()).padStart(2, "0"),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-lg tabular-nums" style={{ color: AMBER }}>
      {time ? (
        <>
          {time.hh}
          <span className="blink-soft">:</span>
          {time.mm}
        </>
      ) : (
        "--:--"
      )}
    </span>
  );
}
