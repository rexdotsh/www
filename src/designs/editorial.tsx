import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 2 — "editorial"
 * a personal periodical. cream paper, serif masthead, dotted leaders,
 * a colophon. reads like the front matter of a small magazine.
 */
export default function EditorialDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();

  const toc = [
    { label: "writing", folio: "01", href: "#writing" },
    { label: "projects", folio: "02", href: "#projects" },
    { label: "elsewhere", folio: "03", href: "#elsewhere" },
    { label: "colophon", folio: "04", href: "#colophon" },
  ];

  return (
    <main className="min-h-dvh bg-[#f7f2e7] px-6 py-14 font-serif-body text-[#211d18] selection:bg-[#a3222c] selection:text-[#f7f2e7] md:py-20">
      <div className="mx-auto w-full max-w-xl">
        {/* masthead */}
        <header className="rise text-center" style={{ animationDelay: "0ms" }}>
          <p className="text-[11px] text-[#8a7f6d] uppercase tracking-[0.35em]">
            the personal periodical of
          </p>
          <h1 className="mt-3 font-serif-display text-[clamp(4rem,16vw,7.5rem)] leading-[0.9] tracking-[-0.02em]">
            {identity.name}
            <span className="text-[#a3222c]">.</span>
          </h1>
          <p className="mt-4 text-[11px] text-[#8a7f6d] uppercase tracking-[0.35em]">
            vol. i — no. 1 — {new Date().getFullYear()}
          </p>
          <div className="mt-8 border-[#211d18] border-t" />
          <div className="mt-[3px] border-[#211d18] border-t" />
        </header>

        {/* table of contents */}
        <nav
          aria-label="table of contents"
          className="rise mt-10"
          style={{ animationDelay: "90ms" }}
        >
          {toc.map(({ label, folio, href }) => (
            <a
              className="group flex items-baseline py-2.5 text-lg transition-colors duration-150 hover:text-[#a3222c]"
              href={href}
              key={label}
            >
              <span className="font-serif-display text-2xl group-hover:italic">
                {label}
              </span>
              <span className="toc-leader" />
              <span className="text-[#8a7f6d] text-sm tabular-nums group-hover:text-[#a3222c]">
                {folio}
              </span>
            </a>
          ))}
        </nav>

        {/* letter from the editor */}
        <section className="rise mt-14" style={{ animationDelay: "180ms" }}>
          <p className="text-[17px] leading-[1.75]">
            <span className="float-left mt-1 mr-2 font-serif-display text-[3.4rem] leading-[0.8] text-[#a3222c]">
              I
            </span>
            build things on the internet — agents, infrastructure, and the
            occasional website with too many opinions. This page is the index to
            all of it: the writing, the projects, and the places I can be found.
            Everything else is noise, carefully omitted.
            {/* placeholder copy — replace with a real intro */}
          </p>
        </section>

        {/* the plate */}
        <figure
          className="rise mt-14 text-center"
          style={{ animationDelay: "260ms" }}
        >
          <img
            alt="An ASCII rose, rendered as an engraving"
            className="mx-auto w-40 select-none opacity-90 [filter:sepia(0.9)_saturate(0.55)_contrast(1.05)] md:w-48"
            height="320"
            src="/rose.avif"
            width="320"
          />
          <figcaption className="mt-3 text-[#8a7f6d] text-sm italic">
            fig. 1 — the rose, resident mascot.
          </figcaption>
        </figure>

        {/* writing */}
        <Section id="writing" title="writing" folio="01">
          {POSTS.map((post) => (
            <a
              className="group flex items-baseline justify-between gap-6 border-[#d9cfbc] border-b py-3.5 transition-colors duration-150 hover:text-[#a3222c]"
              href={post.href}
              key={post.title}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="font-serif-display text-xl group-hover:italic">
                {post.title}
              </span>
              <span className="shrink-0 text-[#8a7f6d] text-xs uppercase tracking-[0.2em]">
                {post.date}
              </span>
            </a>
          ))}
          <p className="mt-4 text-[#8a7f6d] text-sm italic">
            the full archive lives at{" "}
            <ExtLink href="https://blog.rex.wf">blog.rex.wf</ExtLink> — awaiting
            its migration here.
          </p>
        </Section>

        {/* projects */}
        <Section id="projects" title="appendix: projects" folio="02">
          {PROJECTS.map((project, index) => (
            <a
              className="group flex items-baseline gap-4 border-[#d9cfbc] border-b py-3.5 transition-colors duration-150 hover:text-[#a3222c]"
              href={project.href}
              key={project.name}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="w-6 shrink-0 text-[#8a7f6d] text-sm italic">
                {String.fromCharCode(97 + index)}.
              </span>
              <span className="font-serif-display text-xl group-hover:italic">
                {project.name}
              </span>
              <span className="hidden min-w-0 flex-1 truncate text-right text-[#8a7f6d] text-sm md:block">
                {project.description}
              </span>
            </a>
          ))}
        </Section>

        {/* elsewhere */}
        <Section id="elsewhere" title="elsewhere" folio="03">
          <p className="text-[17px] leading-[1.9]">
            {links.map(({ href, label }, index) => (
              <span key={href}>
                <ExtLink href={href}>{label}</ExtLink>
                {index < links.length - 1 && (
                  <span className="text-[#8a7f6d]"> · </span>
                )}
              </span>
            ))}
          </p>
        </Section>

        {/* colophon */}
        <Section id="colophon" title="colophon" folio="04">
          <div className="space-y-2 font-mono text-[13px] text-[#6d6353] leading-relaxed">
            <p>
              set in instrument serif & newsreader. built with tanstack start,
              served from the edge.
            </p>
            <p>
              {track
                ? `presently on the phonograph: ${track.artist} — ${track.name}.`
                : `presently: ${NOW.doing}.`}
            </p>
            <p>
              © {new Date().getFullYear()} {identity.name} — {NOW.location}.
            </p>
          </div>
          <div className="mt-10 border-[#211d18] border-t" />
          <p className="mt-3 pb-6 text-center text-[11px] text-[#8a7f6d] uppercase tracking-[0.35em]">
            fin
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  children,
  folio,
  id,
  title,
}: {
  children: React.ReactNode;
  folio: string;
  id: string;
  title: string;
}) {
  return (
    <section className="mt-16 scroll-mt-10" id={id}>
      <div className="flex items-baseline justify-between border-[#211d18] border-b pb-2">
        <h2 className="text-[11px] uppercase tracking-[0.35em]">{title}</h2>
        <span className="text-[#8a7f6d] text-[11px] tabular-nums">{folio}</span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ExtLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <a
      className="text-[#a3222c] underline decoration-[#a3222c]/40 underline-offset-4 transition-colors duration-150 hover:decoration-[#a3222c] hover:italic"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}
