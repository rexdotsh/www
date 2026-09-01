export default function Navigation({ hostname }: { hostname: string }) {
  const links = [
    { href: "https://blog.rex.wf", text: "BLOG" },
    ...(hostname === "mridul.sh"
      ? [{ href: "/resume", text: "RESUME" }]
      : [{ href: "https://x.com/rexmkv", text: "TWITTER" }]),
    { href: "https://github.com/rexdotsh", text: "GITHUB" },
    { href: "https://floraorg.github.io", text: "FLORA" },
  ];

  return (
    <nav className="mt-6 mb-36 flex flex-col items-center gap-6 md:mt-8 md:mb-0 md:flex-row md:gap-12">
      {links.map(({ href, text }) => (
        <a
          className="rounded-sm font-bold text-lg text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background md:my-12 md:text-2xl"
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
