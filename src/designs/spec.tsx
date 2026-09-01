import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

const INK = "#22344a";
const FAINT = "#8b97a5";

/**
 * design 5 — "spec sheet"
 * the site as an engineering drawing: title block, dimension lines on
 * the rose, a bill of materials, revision history, and general notes.
 */
export default function SpecDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();

  return (
    <main
      className="graph-paper min-h-dvh bg-[#fdfdfb] px-4 py-10 font-mono text-sm md:px-6 md:py-14"
      style={{ color: INK }}
    >
      <div
        className="relative mx-auto w-full max-w-3xl border-2 bg-[#fdfdfb]/80 shadow-sm"
        style={{ borderColor: INK }}
      >
        {/* title block */}
        <header
          className="rise grid grid-cols-2 border-b-2 md:grid-cols-6"
          style={{ borderColor: INK }}
        >
          <h1
            className="col-span-2 flex flex-col justify-center border-b px-4 py-3 md:col-span-3 md:border-r md:border-b-0"
            style={{ borderColor: INK }}
          >
            <span
              className="text-[10px] uppercase tracking-[0.3em]"
              style={{ color: FAINT }}
            >
              dwg. title
            </span>
            <span className="font-bold font-grotesk text-base uppercase tracking-wider">
              {identity.name} — personal website
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: FAINT }}
            >
              general arrangement
            </span>
          </h1>
          <TitleCell label="drawn by" value={identity.name} />
          <TitleCell label="scale" value="1:1" />
          <TitleCell label="rev" last value="A" />
        </header>

        {/* drawing area */}
        <section
          className="rise relative px-6 py-12 md:px-12"
          style={{ animationDelay: "90ms" }}
        >
          {/* stamp */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-6 right-4 rotate-[8deg] select-none border-[3px] border-[#c03535] px-3 py-1 text-center opacity-70 md:right-10"
          >
            <span className="block font-bold text-[#c03535] text-sm uppercase tracking-[0.3em]">
              approved
            </span>
            <span className="block text-[#c03535] text-[9px] uppercase tracking-[0.2em]">
              by the artist
            </span>
          </div>

          <div className="mx-auto w-fit">
            {/* top dimension */}
            <Dimension label="≈ 320 px" />
            <div className="mt-2 flex items-stretch gap-3">
              <div
                className="relative border border-dashed p-4"
                style={{ borderColor: FAINT }}
              >
                <img
                  alt="Rose — item 001, dimensioned drawing"
                  className="w-44 select-none [filter:saturate(0.85)] md:w-56"
                  fetchPriority="high"
                  height="320"
                  src="/rose.avif"
                  width="320"
                />
                {/* leader line callout */}
                <div className="-right-3 absolute top-[30%] hidden w-40 translate-x-full items-center md:flex">
                  <span
                    className="h-px w-10"
                    style={{ backgroundColor: FAINT }}
                  />
                  <span
                    className="ml-2 text-[10px] leading-tight"
                    style={{ color: FAINT }}
                  >
                    petal, pink
                    <br />
                    (#ff1f56)
                  </span>
                </div>
                <div className="-left-3 absolute bottom-[18%] hidden w-40 -translate-x-full items-center justify-end md:flex">
                  <span
                    className="mr-2 text-right text-[10px] leading-tight"
                    style={{ color: FAINT }}
                  >
                    stem not incl.
                    <br />
                    see fig. 2 (n/a)
                  </span>
                  <span
                    className="h-px w-10"
                    style={{ backgroundColor: FAINT }}
                  />
                </div>
              </div>
              {/* right dimension */}
              <div
                className="flex flex-col items-center text-[10px]"
                style={{ color: FAINT }}
              >
                <span>↑</span>
                <span
                  className="w-px flex-1"
                  style={{ backgroundColor: FAINT }}
                />
                <span className="py-1 [writing-mode:vertical-rl]">
                  aspect 1:1
                </span>
                <span
                  className="w-px flex-1"
                  style={{ backgroundColor: FAINT }}
                />
                <span>↓</span>
              </div>
            </div>
            <p
              className="mt-3 text-center text-[10px] uppercase tracking-[0.3em]"
              style={{ color: FAINT }}
            >
              item 001 — rose, ascii, qty 1
            </p>
          </div>
        </section>

        {/* bill of materials */}
        <section
          className="rise border-t-2"
          style={{ animationDelay: "180ms", borderColor: INK }}
        >
          <h2
            className="border-b px-4 py-2 font-bold text-[11px] uppercase tracking-[0.3em]"
            style={{ borderColor: INK }}
          >
            bill of materials — projects
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className="border-b uppercase tracking-[0.2em]"
                  style={{ borderColor: FAINT, color: FAINT }}
                >
                  <th className="px-4 py-2 font-normal">item</th>
                  <th className="px-4 py-2 font-normal">part no.</th>
                  <th className="hidden px-4 py-2 font-normal md:table-cell">
                    description
                  </th>
                  <th className="px-4 py-2 font-normal">matl.</th>
                  <th className="px-4 py-2 text-right font-normal">yr</th>
                </tr>
              </thead>
              <tbody>
                {PROJECTS.map((project, index) => (
                  <tr
                    className="group border-b transition-colors duration-100 last:border-b-0 hover:bg-[#eef2f6]"
                    key={project.name}
                    style={{ borderColor: "#dde3ea" }}
                  >
                    <td
                      className="px-4 py-2.5 tabular-nums"
                      style={{ color: FAINT }}
                    >
                      {String(index + 1).padStart(3, "0")}
                    </td>
                    <td className="px-4 py-2.5">
                      <a
                        className="font-bold underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-100 group-hover:decoration-[#22344a]"
                        href={project.href}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {project.name}
                      </a>
                    </td>
                    <td className="hidden px-4 py-2.5 md:table-cell">
                      {project.description}
                    </td>
                    <td className="px-4 py-2.5">{project.language}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {project.year}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* revision history */}
        <section
          className="rise border-t-2"
          style={{ animationDelay: "270ms", borderColor: INK }}
        >
          <h2
            className="border-b px-4 py-2 font-bold text-[11px] uppercase tracking-[0.3em]"
            style={{ borderColor: INK }}
          >
            revision history — writing
          </h2>
          {POSTS.map((post, index) => (
            <a
              className="flex items-baseline gap-4 border-b px-4 py-2.5 text-xs transition-colors duration-100 last:border-b-0 hover:bg-[#eef2f6]"
              href={post.href}
              key={post.title}
              rel="noopener noreferrer"
              style={{ borderColor: "#dde3ea" }}
              target="_blank"
            >
              <span className="w-8 shrink-0 font-bold">
                {String.fromCharCode(65 + POSTS.length - 1 - index)}
              </span>
              <span
                className="w-20 shrink-0 tabular-nums"
                style={{ color: FAINT }}
              >
                {post.date}
              </span>
              <span className="min-w-0 flex-1 truncate">{post.title}</span>
            </a>
          ))}
        </section>

        {/* general notes */}
        <section
          className="rise grid border-t-2 md:grid-cols-2"
          style={{ animationDelay: "360ms", borderColor: INK }}
        >
          <div
            className="border-b p-4 md:border-r md:border-b-0"
            style={{ borderColor: INK }}
          >
            <h2 className="font-bold text-[11px] uppercase tracking-[0.3em]">
              notes:
            </h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed">
              <li>all links load in new window unless noted.</li>
              <li>tolerances: opinions ± strong.</li>
              <li>
                ambient noise:{" "}
                {track ? `${track.artist} — ${track.name}` : NOW.doing}.
              </li>
              <li>do not scale drawing. it scales itself.</li>
            </ol>
          </div>
          <div className="p-4">
            <h2 className="font-bold text-[11px] uppercase tracking-[0.3em]">
              external refs:
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {links.map(({ href, label }, index) => (
                <a
                  className="underline decoration-[#8b97a5] underline-offset-4 transition-colors duration-100 hover:text-[#c03535] hover:decoration-[#c03535]"
                  href={href}
                  key={href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  ref. {index + 1} — {label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* footer strip */}
        <footer
          className="rise flex items-center justify-between border-t-2 px-4 py-2 text-[10px] uppercase tracking-[0.3em]"
          style={{ animationDelay: "420ms", borderColor: INK, color: FAINT }}
        >
          <span>sheet 1 of 1</span>
          <span className="hidden md:block">do not fold</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </div>
    </main>
  );
}

function TitleCell({
  label,
  last,
  value,
}: {
  label: string;
  last?: boolean;
  value: string;
}) {
  return (
    <div
      className={`flex flex-col justify-center px-4 py-3 ${last ? "" : "border-r"}`}
      style={{ borderColor: INK }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.3em]"
        style={{ color: FAINT }}
      >
        {label}
      </span>
      <span className="font-bold uppercase">{value}</span>
    </div>
  );
}

function Dimension({ label }: { label: string }) {
  return (
    <div className="flex items-center text-[10px]" style={{ color: FAINT }}>
      <span>←</span>
      <span className="h-px flex-1" style={{ backgroundColor: FAINT }} />
      <span className="px-2">{label}</span>
      <span className="h-px flex-1" style={{ backgroundColor: FAINT }} />
      <span>→</span>
    </div>
  );
}
