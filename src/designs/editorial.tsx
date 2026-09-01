import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 2 — "editorial"
 * a personal periodical. cream paper with real grain, scotch rules,
 * dotted leaders, marginalia, and a colophon. front matter of a small
 * magazine that takes itself just seriously enough.
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
    <main className="paper-grain min-h-dvh bg-[#f7f2e7] px-6 py-14 font-serif-body text-[#211d18] [font-variant-numeric:oldstyle-nums] selection:bg-[#a3222c] selection:text-[#f7f2e7] md:py-20">
      <div className="mx-auto w-full max-w-xl">
        {/* masthead */}
        <header className="text-center">
          <div
            className="rise flex items-baseline justify-between border-[#211d18] border-b pb-2 text-[10px] text-[#8a7f6d] uppercase tracking-[0.3em]"
            style={{ animationDelay: "0ms" }}
          >
            <span>№ 1</span>
            <span>free forever</span>
            <span>{new Date().getFullYear()}</span>
          </div>
          <p
            className="rise mt-10 text-[11px] text-[#8a7f6d] uppercase tracking-[0.35em]"
            style={{ animationDelay: "70ms" }}
          >
            the personal periodical of
          </p>
          <h1
            className="rise mt-3 font-serif-display text-[clamp(4.5rem,17vw,8rem)] leading-[0.85] tracking-[-0.02em]"
            style={{ animationDelay: "140ms" }}
          >
            {identity.name}
            <span className="text-[#a3222c]">.</span>
          </h1>
          <p
            className="rise mt-5 text-[11px] text-[#8a7f6d] uppercase tracking-[0.35em]"
            style={{ animationDelay: "210ms" }}
          >
            vol. i — {identity.tagline}
          </p>
          {/* scotch rule */}
          <div className="rise mt-8" style={{ animationDelay: "260ms" }}>
            <div className="border-[#211d18] border-t-[3px]" />
            <div className="mt-[3px] border-[#211d18] border-t" />
            <span
              aria-hidden="true"
              className="mt-4 inline-block font-serif-display text-[#a3222c] text-xl"
            >
              ❦
            </span>
          </div>
        </header>

        {/* table of contents */}
        <nav aria-label="table of contents" className="mt-8">
          {toc.map(({ label, folio, href }, index) => (
            <a
              className="rise group flex items-baseline py-2.5 text-lg transition-colors duration-150 hover:text-[#a3222c]"
              href={href}
              key={label}
              style={{ animationDelay: `${320 + index * 60}ms` }}
            >
              <span className="font-serif-display text-2xl group-hover:italic">
                {label}
              </span>
              <span className="toc-leader" />
              <span className="text-[#8a7f6d] text-sm tabular-nums transition-colors duration-150 group-hover:text-[#a3222c]">
                {folio}
              </span>
            </a>
          ))}
        </nav>

        {/* letter from the editor */}
        <section
          className="rise relative mt-14"
          style={{ animationDelay: "560ms" }}
        >
          <Marginalia>a letter, in lieu of an about page</Marginalia>
          <p className="text-[17px] leading-[1.75]">
            <span className="float-left mt-1 mr-2 font-serif-display text-[3.4rem] text-[#a3222c] leading-[0.8]">
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
          className="rise relative mt-14 text-center"
          style={{ animationDelay: "640ms" }}
        >
          <Marginalia>the rose has been here since v1.</Marginalia>
          <div className="mx-auto inline-block border border-[#211d18]/60 bg-[#f2ecdc] p-7 shadow-[inset_0_0_0_4px_#f2ecdc,inset_0_0_0_5px_rgba(33,29,24,0.25)]">
            <img
              alt="An ASCII rose, rendered as an engraving"
              className="mx-auto w-36 select-none opacity-90 mix-blend-multiply [filter:sepia(0.9)_saturate(0.55)_contrast(1.05)] md:w-44"
              height="320"
              src="/rose.avif"
              width="320"
            />
          </div>
          <figcaption className="mt-3 text-[#8a7f6d] text-sm italic">
            fig. 1 — the rose, resident mascot.
          </figcaption>
        </figure>

        {/* writing */}
        <Section
          folio="01"
          id="writing"
          note="the archive is migrating."
          title="writing"
        >
          {POSTS.map((post, index) => (
            <a
              className="group flex items-baseline gap-4 border-[#d9cfbc] border-b py-3.5 transition-colors duration-150 hover:text-[#a3222c]"
              href={post.href}
              key={post.title}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="w-7 shrink-0 text-[#8a7f6d] text-sm italic">
                {["i.", "ii.", "iii.", "iv.", "v."][index]}
              </span>
              <span className="font-serif-display text-xl group-hover:italic">
                {post.title}
              </span>
              <span className="toc-leader hidden md:block" />
              <span className="ml-auto shrink-0 text-[#8a7f6d] text-xs uppercase tracking-[0.2em] md:ml-0">
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
        <Section
          folio="02"
          id="projects"
          note="mostly agents & infrastructure."
          title="appendix: projects"
        >
          {PROJECTS.map((project, index) => (
            <a
              className="group flex items-baseline gap-4 border-[#d9cfbc] border-b py-3.5 transition-colors duration-150 hover:text-[#a3222c]"
              href={project.href}
              key={project.name}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="w-7 shrink-0 text-[#8a7f6d] text-sm italic">
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
        <Section
          folio="03"
          id="elsewhere"
          note="correspondence welcome."
          title="elsewhere"
        >
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
        <Section folio="04" id="colophon" note="smallprint." title="colophon">
          <div className="gap-8 space-y-2 font-mono text-[#6d6353] text-[13px] leading-relaxed md:columns-2 md:space-y-0">
            <p className="md:mb-2">
              set in instrument serif & newsreader. built with tanstack start,
              served from the edge.
            </p>
            <p className="md:mb-2">
              {track
                ? `presently on the phonograph: ${track.artist} — ${track.name}.`
                : `presently: ${NOW.doing}.`}
            </p>
            <p className="md:mb-2">
              © {new Date().getFullYear()} {identity.name} — {NOW.location}.
            </p>
            <p>printed nowhere. published everywhere.</p>
          </div>
          <div className="mt-10">
            <div className="border-[#211d18] border-t" />
            <div className="mt-[3px] border-[#211d18] border-t-[3px]" />
          </div>
          <p className="mt-4 pb-6 text-center text-[#8a7f6d] text-[11px] uppercase tracking-[0.35em]">
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
  note,
  title,
}: {
  children: React.ReactNode;
  folio: string;
  id: string;
  note?: string;
  title: string;
}) {
  return (
    <section className="relative mt-16 scroll-mt-10" id={id}>
      {note ? <Marginalia>{note}</Marginalia> : null}
      <div className="flex items-baseline justify-between border-[#211d18] border-b pb-2">
        <h2 className="text-[11px] uppercase tracking-[0.35em]">
          <span aria-hidden="true" className="mr-2 text-[#a3222c]">
            ¶
          </span>
          {title}
        </h2>
        <span className="text-[#8a7f6d] text-[11px] tabular-nums">{folio}</span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Marginalia({ children }: { children: React.ReactNode }) {
  return (
    <aside
      aria-hidden="true"
      className="-left-44 absolute top-1 hidden w-36 text-right text-[#8a7f6d] text-xs italic leading-snug xl:block"
    >
      {children}
    </aside>
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
