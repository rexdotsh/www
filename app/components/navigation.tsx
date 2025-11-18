import { getHost } from "@/app/lib/utils";

export default async function Navigation() {
  const host = await getHost();

  const links = [
    { href: "https://blog.rex.wf", text: "BLOG", label: "Read my thoughts" },
    ...(host === "mridul.sh"
      ? [{ href: "/resume", text: "RESUME", label: "View my work history" }]
      : [
          {
            href: "https://x.com/rexmkv",
            text: "TWITTER",
            label: "Follow updates",
          },
        ]),
    {
      href: "https://github.com/rexdotsh",
      text: "GITHUB",
      label: "Check the code",
    },
    { href: "https://flora.tf", text: "FLORA", label: "Latest project" },
  ];

  return (
    <nav className="flex w-full flex-col border-t border-border">
      {links.map(({ href, text, label }) => (
        <a
          className="group relative flex w-full items-baseline justify-between border-b border-border py-6 transition-colors hover:bg-surface"
          href={href}
          key={href}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="font-bold text-5xl text-primary tracking-tighter transition-transform duration-300 group-hover:translate-x-4 md:text-7xl lg:text-8xl">
            {text}
          </span>
          <span className="hidden font-mono text-secondary text-sm uppercase tracking-widest md:block md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
            {label} ↗
          </span>
        </a>
      ))}
    </nav>
  );
}
