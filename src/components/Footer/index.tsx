import { Component } from "solid-js";

const Footer: Component = () => {
  return (
    <footer class="absolute bottom-0 w-full py-4 px-6 text-center text-neutral-500 text-sm md:text-base">
      <div class="flex justify-center items-center space-x-3 transition-colors duration-300 hover:text-neutral-300">
        <span>© {new Date().getFullYear()}</span>
        <span class="text-rose-400/80">•</span>
        <span>rex@unreal:~#</span>
      </div>
    </footer>
  );
};

export default Footer;
