import { Component, For } from "solid-js";

const Navigation: Component = () => {
  const links = [
    { href: "https://blog.rex.wf", text: "BLOG" },
    // {href: "/resume", text: "RESUME"},
    { href: "https://x.com/rexmkv", text: "TWITTER" },
    { href: "https://github.com/rexdotsh", text: "GITHUB" },
    { href: "https://flora.tf", text: "FLORA" },
  ];

  return (
    <nav class="flex flex-col md:flex-row items-center gap-6 md:gap-12 mt-8 mb-36 md:mt-12 md:mb-0">
      <For each={links}>
        {({ href, text }) => (
          <a href={href} class="text-lg md:text-2xl md:my-12 text-[#d6e9ef] font-bold hover:text-rose-400/80 transition-colors">
            {text}
          </a>
        )}
      </For>
    </nav>
  );
};

export default Navigation;
