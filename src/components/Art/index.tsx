import {Component, createSignal, onMount} from "solid-js";
import Navigation from "./Navigation";
import {desktopAsciiArt, mobileAsciiArt} from "./ascii-art";

const AsciiArt: Component = () => {
  const [art, setArt] = createSignal(desktopAsciiArt);

  onMount(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    setArt(mediaQuery.matches ? desktopAsciiArt : mobileAsciiArt);

    const handleResize = () => {
      setArt(mediaQuery.matches ? desktopAsciiArt : mobileAsciiArt);
    };

    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  });

  return (
    <div class="h-full flex justify-center flex-col items-center">
      <pre
        class="select-none text-[2.8px] md:text-[3.2px] leading-[1.4px] md:leading-[1.6px] 
            text-rose-500 text-center mx-auto">
        {art()}
      </pre>
      <Navigation />
    </div>
  );
};

export default AsciiArt;
