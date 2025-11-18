import Image from "next/image";
import rose from "@/public/rose.avif";

export default function RoseAscii() {
  return (
    <figure className="flex flex-col items-center justify-center w-full h-full p-8">
      {/* 
        Container needs explicit dimensions for "fill" to work with aspect-ratio.
        Using a max-width to prevent it from getting too huge on large screens.
      */}
      <div className="relative w-full max-w-md aspect-square fade-in select-none grayscale contrast-125 mix-blend-multiply dark:mix-blend-normal dark:invert">
        <Image
          alt="Rose"
          className="object-contain"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          src={rose}
        />
      </div>
      <figcaption className="mt-8 font-mono text-xs text-gray-500 uppercase tracking-widest text-center">
        Fig. 1.0 — The Rose
      </figcaption>
    </figure>
  );
}
