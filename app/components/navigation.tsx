import { getHost } from "@/app/lib/utils";

const Navigation = async () => {
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
    <nav className="mt-8 mb-36 flex flex-col items-center gap-6 md:mt-8 md:mb-0 md:flex-row md:gap-12">
      {links.map(({ href, text }) => (
        <a
          className="font-bold text-[var(--primary)] text-lg transition-colors hover:text-rose-700 md:my-12 md:text-2xl dark:hover:text-rose-500/80"
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
};

export default Navigation;
