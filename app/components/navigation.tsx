import { getHost } from "@/app/lib/utils";

export default async function Navigation() {
  const host = await getHost();

  const links = [
    { href: "https://blog.rex.wf", text: "Blog", meta: "01" },
    ...(host === "mridul.sh"
      ? [{ href: "/resume", text: "Resume", meta: "02" }]
      : [{ href: "https://x.com/rexmkv", text: "Twitter", meta: "02" }]),
    { href: "https://github.com/rexdotsh", text: "Github", meta: "03" },
    { href: "https://flora.tf", text: "Flora", meta: "04" },
  ];

  return (
    <nav className="flex flex-col w-full">
      <ul className="w-full space-y-2">
        {links.map(({ href, text, meta }) => (
          <li key={href} className="w-full">
            <a
              className="nav-link group flex items-baseline justify-between w-full font-serif text-2xl hover:text-accent transition-colors"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="group-hover:italic">{text}</span>
              <span className="font-mono text-xs text-gray-400 group-hover:text-accent/50">
                {meta}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
