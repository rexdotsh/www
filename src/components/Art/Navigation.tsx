import {Component} from "solid-js";

const Navigation: Component = () => {
  const links = [
    {href: "https://blog.rex.wf", text: "BLOG"},
    {href: "/resume", text: "RESUME"},
    {href: "https://github.com/rexdotsh", text: "GITHUB"},
    {href: "https://flora.tf", text: "FLORA"},
  ];

  return (
    <nav class="flex flex-col md:flex-row items-center gap-6 md:gap-12 mt-16 md:mt-12">
      {links.map(({href, text}) => (
        <a href={href} class="text-lg md:text-2xl md:my-12 text-white font-bold hover:text-rose-400/80 transition-colors">
          {text}
        </a>
      ))}
    </nav>
  );
};

export default Navigation;
