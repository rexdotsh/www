import Image from "next/image";
import rose from "@/public/rose.avif";

export default function RoseAscii() {
  return (
    <figure className="flex flex-col items-center justify-center w-full h-full p-8 group">
      {/* 
        Removed grayscale.
        Light Mode: mix-blend-multiply gives it a "printed ink" look on the paper background.
        Dark Mode: mix-blend-screen makes the red ascii "glow" against the black.
        Hover: subtle scale and brightness boost.
      */}
      <div className="relative w-full max-w-md aspect-square fade-in select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-500 group-hover:scale-105 group-hover:contrast-125">
        <Image
          alt="Rose"
          className="object-contain"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          src={rose}
        />
      </div>
      <figcaption className="mt-8 font-mono text-xs text-gray-500 uppercase tracking-widest text-center transition-colors group-hover:text-accent">
        Fig. 1.0 — The Rose
      </figcaption>
    </figure>
  );
}
