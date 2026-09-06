import { Link } from "@tanstack/react-router";
import { LINKS, PROJECTS } from "@/lib/content";
import { PUBLISHED_META } from "@/lib/posts-meta";

function ProjectVisual({
  kind,
}: {
  kind: (typeof PROJECTS)[number]["visual"];
}) {
  if (kind === "proxy") {
    return (
      <div aria-hidden="true" className="project-art art-proxy">
        <span className="art-corner">request → authorize → build</span>
        <div className="proxy-flow">
          <span className="proxy-end">
            agent<span>01</span>
          </span>
          <span className="proxy-wire" />
          <span className="proxy-key">
            k<span>↗</span>
          </span>
          <span className="proxy-wire" />
          <span className="proxy-end">
            oauth<span>02</span>
          </span>
        </div>
        <span className="art-bottom">a small key. an open door.</span>
      </div>
    );
  }
  if (kind === "scan") {
    return (
      <div aria-hidden="true" className="project-art art-scan">
        <span className="art-corner">s3enum-ng / discovery</span>
        <div className="scan-grid">
          {Array.from({ length: 60 }, (_, i) => (
            <span
              className={i % 11 === 0 || i % 13 === 0 ? "scan-hit" : undefined}
              key={i}
            />
          ))}
        </div>
        <span className="scan-line" />
        <span className="art-bottom">
          <span className="scan-dot" /> looking beneath the surface
        </span>
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="project-art art-web">
      <span className="art-corner">view-source: a personal space</span>
      <div className="web-sheet">
        <span className="web-sheet-top">
          a place for things <span>↗</span>
        </span>
        <span className="web-sheet-title">
          hello,
          <br />
          <em>world.</em>
          <span className="web-flower">✳</span>
        </span>
        <span className="web-sheet-rule" />
      </div>
      <span className="art-bottom">handmade, with a few moving parts.</span>
    </div>
  );
}

export default function PortfolioSections() {
  return (
    <>
      <section aria-labelledby="work-title" className="work-section" id="work">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / from the workbench</p>
            <h2 id="work-title">
              Things I’ve <em>built.</em>
            </h2>
          </div>
          <a
            className="text-link"
            href={LINKS.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            all on github <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="project-grid">
          {PROJECTS.map((project, index) => (
            <a
              className="project-card"
              href={project.href}
              key={project.name}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ProjectVisual kind={project.visual} />
              <div className="project-meta eyebrow">
                <span>
                  0{index + 1} / {project.category}
                </span>
                <span aria-hidden="true">↗</span>
              </div>
              <h3>{project.name}</h3>
              <p className="project-summary">{project.description}</p>
              <p className="project-detail">{project.detail}</p>
              <span className="project-source">
                explore the source <span aria-hidden="true">↗</span>
              </span>
            </a>
          ))}
        </div>
      </section>
      <section
        aria-labelledby="notes-title"
        className="notes-section"
        id="notes"
      >
        <div className="notebook">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 / notes in the margin</p>
              <h2 id="notes-title">
                A few <em>words.</em>
              </h2>
            </div>
            <Link className="text-link" to="/blog">
              the archive <span aria-hidden="true">↗</span>
            </Link>
          </div>
          {PUBLISHED_META.map((post) => (
            <Link
              className="note-entry"
              key={post.slug}
              params={{ slug: post.slug }}
              to="/blog/$slug"
            >
              <div className="eyebrow">
                <time dateTime={post.date}>{post.dateLabel}</time>
                <span>field notes / {post.meta[0]}</span>
              </div>
              <h3>
                {post.title}
                <span aria-hidden="true">↗</span>
              </h3>
              <p>{post.description}</p>
              <span className="text-link">
                read the story <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
          <a
            className="archive-note"
            href={LINKS.archive}
            rel="noopener noreferrer"
            target="_blank"
          >
            also filed away: older ctf writeups{" "}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <aside className="workshop-note">
          <span className="eyebrow">a shared corner</span>
          <div className="workshop-flower" aria-hidden="true">
            ✳
          </div>
          <h3>
            Better with
            <br />
            <em>friends.</em>
          </h3>
          <p>
            Flora is our little workshop for random things on the web. A place
            to try things and see what grows.
          </p>
          <a
            className="text-link"
            href={LINKS.flora}
            rel="noopener noreferrer"
            target="_blank"
          >
            step into flora <span aria-hidden="true">↗</span>
          </a>
          <span className="workshop-footnote">
            a side project of side projects.
          </span>
        </aside>
      </section>
    </>
  );
}
