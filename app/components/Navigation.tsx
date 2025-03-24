const Navigation = () => {
  const links = [
    { href: "https://blog.rex.wf", text: "BLOG" },
    // {href: "/resume", text: "RESUME"},
    { href: "https://x.com/rexmkv", text: "TWITTER" },
    { href: "https://github.com/rexdotsh", text: "GITHUB" },
    { href: "https://flora.tf", text: "FLORA" },
  ];

  return (
    <nav className="flex flex-col md:flex-row items-center gap-6 md:gap-12 mt-8 mb-36 md:mt-12 md:mb-0">
      {links.map(({ href, text }) => (
        <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="text-lg md:text-2xl md:my-12 text-[#d6e9ef] font-bold hover:text-rose-400/80 transition-colors">
          {text}
        </a>
      ))}
    </nav>
  );
};

export default Navigation;
