import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 4 — "museum"
 * the site as a small exhibition. the rose hangs framed as exhibit n°1,
 * everything else is placard typography and gallery wayfinding.
 */
export default function MuseumDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();

  return (
    <main className="min-h-dvh bg-[#fbfaf7] px-6 py-16 font-grotesk text-[#191817] selection:bg-[#191817] selection:text-[#fbfaf7] md:py-24">
      <div className="mx-auto w-full max-w-2xl">
        {/* entrance */}
        <header className="rise text-center">
          <p className="text-[10px] text-[#98928a] uppercase tracking-[0.5em]">
            the permanent collection of
          </p>
          <h1 className="mt-4 font-light text-4xl tracking-[0.3em] uppercase md:text-5xl">
            {identity.name}
          </h1>
          <p className="mt-4 text-[#98928a] text-xs tracking-[0.2em]">
            open 24 hours — admission free — {NOW.location}
          </p>
        </header>

        {/* exhibit n°1 — the rose */}
        <section className="mt-20 text-center">
          {/* spotlight */}
          <div
            className="rise relative mx-auto w-fit"
            style={{ animationDelay: "120ms" }}
          >
            <div
              aria-hidden="true"
              className="-top-16 -translate-x-1/2 pointer-events-none absolute left-1/2 h-64 w-72 rounded-full"
              style={{
                background:
                  "radial-gradient(ellipse at top, rgba(255,231,180,0.5) 0%, transparent 65%)",
              }}
            />
            {/* frame */}
            <div className="relative border-[10px] border-[#26221d] bg-[#f4f1ea] p-8 shadow-[0_20px_50px_-20px_rgba(25,24,23,0.4),inset_0_0_0_1px_rgba(25,24,23,0.2)] md:p-12">
              <img
                alt="Rose — ASCII on AVIF, 2025"
                className="mx-auto w-40 select-none md:w-52"
                fetchPriority="high"
                height="320"
                src="/rose.avif"
                width="320"
              />
            </div>
          </div>

          {/* placard */}
          <div
            className="rise mx-auto mt-10 w-fit max-w-xs border border-[#e3ded4] bg-white px-6 py-4 text-left shadow-[0_2px_10px_rgba(25,24,23,0.05)]"
            style={{ animationDelay: "220ms" }}
          >
            <p className="font-medium text-sm">
              Rose <span className="font-light text-[#98928a]">(2025)</span>
            </p>
            <p className="mt-0.5 font-serif-body text-[#6d675e] text-sm italic">
              ascii on avif, 320 × 320
            </p>
            <p className="mt-2 text-[#98928a] text-xs leading-relaxed">
              collection of the artist. acquired at v1; has survived every
              redesign since.
            </p>
            <p className="mt-3 text-[10px] text-[#b9b3a9] uppercase tracking-[0.3em]">
              exhibit n°1
            </p>
          </div>
        </section>

        {/* audio guide */}
        {track ? (
          <section
            className="rise mx-auto mt-16 w-fit max-w-sm"
            style={{ animationDelay: "300ms" }}
          >
            <a
              className="group flex items-center gap-4 border border-[#e3ded4] bg-white px-5 py-3 shadow-[0_2px_10px_rgba(25,24,23,0.05)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(25,24,23,0.1)]"
              href={track.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span aria-hidden="true" className="text-lg">
                🎧
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-[10px] text-[#98928a] uppercase tracking-[0.3em]">
                  audio guide — {track.isPlaying ? "now playing" : "last track"}
                </span>
                <span className="block truncate text-sm">
                  {track.name}{" "}
                  <span className="text-[#98928a]">— {track.artist}</span>
                </span>
              </span>
            </a>
          </section>
        ) : null}

        {/* gallery I — works */}
        <Gallery number="i" title="works">
          <div className="grid gap-px border border-[#e3ded4] bg-[#e3ded4] md:grid-cols-2">
            {PROJECTS.map((project) => (
              <a
                className="group bg-white p-6 transition-colors duration-200 hover:bg-[#faf8f3]"
                href={project.href}
                key={project.name}
                rel="noopener noreferrer"
                target="_blank"
              >
                <p className="font-medium text-sm">
                  {project.name}{" "}
                  <span className="font-light text-[#98928a]">
                    ({project.year})
                  </span>
                </p>
                <p className="mt-0.5 font-serif-body text-[#6d675e] text-sm italic">
                  {project.language} on github
                </p>
                <p className="mt-2 text-[#98928a] text-xs leading-relaxed">
                  {project.description}
                </p>
              </a>
            ))}
          </div>
        </Gallery>

        {/* gallery II — writing */}
        <Gallery number="ii" title="writing">
          <div className="border border-[#e3ded4] bg-white">
            {POSTS.map((post) => (
              <a
                className="flex items-baseline justify-between gap-6 border-[#e3ded4] border-b px-6 py-4 transition-colors duration-200 last:border-b-0 hover:bg-[#faf8f3]"
                href={post.href}
                key={post.title}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="text-sm">{post.title}</span>
                <span className="shrink-0 text-[#98928a] text-xs tabular-nums">
                  {post.date}
                </span>
              </a>
            ))}
          </div>
          <p className="mt-3 text-[#98928a] text-xs italic">
            on extended loan from blog.rex.wf — full catalogue there.
          </p>
        </Gallery>

        {/* wayfinding */}
        <Gallery number="iii" title="wayfinding">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {links.map(({ href, label }) => (
              <a
                className="group text-sm tracking-wide transition-colors duration-150 hover:text-[#8a6d1f]"
                href={href}
                key={href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block transition-transform duration-150 ease-strong group-hover:translate-x-1"
                >
                  →
                </span>
                {label}
              </a>
            ))}
          </div>
        </Gallery>

        {/* exit */}
        <footer className="mt-24 border-[#e3ded4] border-t pt-6 text-center">
          <p className="text-[10px] text-[#98928a] uppercase tracking-[0.5em]">
            exit through the gift shop
          </p>
          <p className="mt-2 text-[#b9b3a9] text-xs">
            © {new Date().getFullYear()} {identity.name} — no photography,
            except screenshots
          </p>
        </footer>
      </div>
    </main>
  );
}

function Gallery({
  children,
  number,
  title,
}: {
  children: React.ReactNode;
  number: string;
  title: string;
}) {
  return (
    <section className="mt-20">
      <div className="flex items-center gap-4">
        <span className="text-[#b9b3a9] text-xs italic">gallery {number}</span>
        <div className="h-px flex-1 bg-[#e3ded4]" />
        <h2 className="text-[10px] uppercase tracking-[0.4em]">{title}</h2>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
