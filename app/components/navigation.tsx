import { getHost } from "@/app/lib/utils";

export default async function Navigation() {
  const host = await getHost();

  const links = [
    { href: "https://blog.rex.wf", text: "BLOG" },
    ...(host === "mridul.sh"
      ? [{ href: "/resume", text: "RESUME" }]
      : [{ href: "https://x.com/rexmkv", text: "TWITTER" }]),
    { href: "https://github.com/rexdotsh", text: "GITHUB" },
    { href: "https://flora.tf", text: "FLORA" },
  ];

  return (
    <nav className="mt-6 mb-36 flex flex-col items-center gap-6 md:mt-8 md:mb-0 md:flex-row md:gap-12">
      {links.map(({ href, text }) => (
        <a
          className="font-bold text-[var(--primary)] text-lg transition-colors hover:text-[var(--accent-hover)] md:my-12 md:text-2xl"
          href={href}
          key={href}
          rel="noopener noreferrer"
          target="_blank"
        >
          {text}
        </a>
      ))}
    </nav>
  );
}
