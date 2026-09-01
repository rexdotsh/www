import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

const AD_COPY: Record<string, string> = {
  blog: "WANTED: readers. no experience necessary. apply within.",
  twitter:
    "FOR FOLLOWING: one (1) account, lightly used. strong opinions incl.",
  resume: "SITUATION WANTED: builds things, ships often. references avail.",
  github: "FREE: source code. all of it. no refunds.",
  flora: "LOST: one open canvas for images. reward if used.",
};

/**
 * design 7 — "broadsheet"
 * the front page of a newspaper that only ever covers one person.
 * columns, classifieds, an on-air box, and the rose, pictured yesterday.
 */
export default function BroadsheetDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="paper-grain min-h-dvh bg-[#f4f0e5] px-4 py-10 font-serif-body text-[#1c1a15] selection:bg-[#1c1a15] selection:text-[#f4f0e5] md:px-6 md:py-14">
      <div className="mx-auto w-full max-w-4xl">
        {/* edition strip */}
        <div className="rise flex items-baseline justify-between border-[#1c1a15] border-y py-1.5 text-[10px] uppercase tracking-[0.2em]">
          <span>{today}</span>
          <span className="hidden md:block">late edition</span>
          <span>free forever</span>
        </div>

        {/* masthead */}
        <header
          className="rise mt-4 text-center"
          style={{ animationDelay: "70ms" }}
        >
          <h1 className="font-serif-display text-[clamp(3rem,10vw,5.5rem)] leading-none tracking-tight">
            The Daily {identity.name === "rex" ? "Rex" : "Mridul"}
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-[#6d6656]">
            all the news that's fit to ship — vol. i, n° 1
          </p>
          <div className="mt-3 border-[#1c1a15] border-t-2" />
          <div className="mt-[3px] border-[#1c1a15] border-t" />
        </header>

        {/* headline */}
        <section
          className="rise mt-6 text-center"
          style={{ animationDelay: "140ms" }}
        >
          <h2 className="font-serif-display text-[clamp(2rem,6vw,3.6rem)] uppercase leading-[1.02]">
            local developer ships again
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg italic leading-snug text-[#4a443a]">
            sources confirm the personal website has been redesigned for the
            fifth time this month; observers describe the rose as "unbothered."
          </p>
        </section>

        {/* page grid */}
        <div
          className="rise mt-8 grid gap-6 border-[#1c1a15] border-t pt-6 md:grid-cols-12"
          style={{ animationDelay: "210ms" }}
        >
          {/* lead story */}
          <article className="md:col-span-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#6d6656]">
              from our own correspondent
            </p>
            <div className="mt-3 gap-5 text-[15px] leading-[1.65] [column-rule:1px_solid_#cfc7b4] md:columns-2">
              <p>
                <span className="float-left mt-1 mr-1.5 font-serif-display text-[2.6rem] leading-[0.8]">
                  {identity.name.charAt(0).toUpperCase()}
                </span>
                {identity.name} builds things on the internet — agents,
                infrastructure, and the occasional website with too many
                opinions. Neighbours report frequent commits at unreasonable
                hours.
              </p>
              <p className="mt-3">
                "It's mostly typescript," one witness said, declining to
                elaborate. The subject could not be reached for comment, being
                presently {NOW.doing}.
              </p>
              <p className="mt-3">
                The full archive of correspondence is expected to arrive from{" "}
                <a
                  className="underline decoration-[#1c1a15]/40 underline-offset-2 transition-colors duration-150 hover:text-[#8a1e1e]"
                  href="https://blog.rex.wf"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  blog.rex.wf
                </a>{" "}
                any day now.
              </p>
              <p className="mt-3 text-[#6d6656] italic">
                cont. on page 2 —{" "}
                <span className="not-italic">(there is no page 2)</span>
              </p>
            </div>
          </article>

          {/* photo */}
          <figure className="border-[#cfc7b4] md:col-span-4 md:border-x md:px-6">
            <div className="border border-[#1c1a15] p-2">
              <img
                alt="The rose, pictured yesterday"
                className="w-full select-none mix-blend-multiply [filter:grayscale(0.35)_sepia(0.25)_contrast(1.1)]"
                fetchPriority="high"
                height="320"
                src="/rose.avif"
                width="320"
              />
            </div>
            <figcaption className="mt-2 text-xs italic leading-snug text-[#6d6656]">
              the rose, pictured yesterday. it has held the front page since v1
              and shows no intention of resigning. — staff photographer
            </figcaption>

            {/* inside this issue */}
            <div className="mt-6 border-[#1c1a15] border-t-2 pt-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.25em]">
                inside this issue
              </h3>
              <div className="mt-2 space-y-2">
                {POSTS.map((post) => (
                  <a
                    className="group flex items-baseline justify-between gap-3 text-sm transition-colors duration-150 hover:text-[#8a1e1e]"
                    href={post.href}
                    key={post.title}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="group-hover:italic">{post.title}</span>
                    <span className="shrink-0 text-[#6d6656] text-xs tabular-nums">
                      {post.date}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </figure>

          {/* sidebar */}
          <aside className="md:col-span-3">
            {/* on air */}
            <div className="border-2 border-[#1c1a15] p-4">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em]">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full bg-[#8a1e1e]"
                />
                on air
              </h3>
              {track ? (
                <a
                  className="mt-2 block transition-colors duration-150 hover:text-[#8a1e1e]"
                  href={track.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="block font-bold text-sm leading-snug">
                    {track.name}
                  </span>
                  <span className="block text-xs italic text-[#6d6656]">
                    {track.artist} — {track.album}
                  </span>
                </a>
              ) : (
                <p className="mt-2 text-xs italic text-[#6d6656]">
                  the newsroom is quiet. unusual.
                </p>
              )}
            </div>

            {/* shipping news */}
            <div className="mt-5 border-[#1c1a15] border-t-2 pt-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.25em]">
                shipping news
              </h3>
              <div className="mt-2 space-y-2.5">
                {PROJECTS.slice(0, 4).map((project) => (
                  <a
                    className="group block text-sm leading-snug transition-colors duration-150 hover:text-[#8a1e1e]"
                    href={project.href}
                    key={project.name}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="font-bold group-hover:italic">
                      {project.name}
                    </span>{" "}
                    <span className="text-[#6d6656]">
                      — {project.description}. ({project.year})
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* classifieds */}
            <div className="mt-5 border-[#1c1a15] border-t-2 pt-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.25em]">
                classifieds
              </h3>
              <div className="mt-2 space-y-2">
                {links.map(({ href, label }) => (
                  <a
                    className="block border-[#cfc7b4] border-b pb-2 font-mono text-[11px] leading-relaxed text-[#4a443a] transition-colors duration-150 last:border-b-0 hover:text-[#8a1e1e]"
                    href={href}
                    key={href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {AD_COPY[label] ?? `SEE: ${label}.`}{" "}
                    <span className="underline underline-offset-2">
                      → {label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* footer */}
        <footer
          className="rise mt-10 border-[#1c1a15] border-t-2 pt-2"
          style={{ animationDelay: "280ms" }}
        >
          <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em] text-[#6d6656]">
            <span>
              © {new Date().getFullYear()} the daily {identity.name}
            </span>
            <span className="hidden md:block">printed nowhere daily</span>
            <span>{NOW.location}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
