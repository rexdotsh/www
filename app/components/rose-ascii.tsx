import Image from "next/image";
import rose from "@/public/rose.avif";
import Navigation from "./navigation";

export default function RoseAscii() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="fade-in rose-container relative select-none">
        <Image
          alt="Rose"
          className="select-none object-contain"
          fill
          priority
          sizes="(min-width: 1024px) 310px, (min-width: 768px) 30vw, 70vw"
          src={rose}
        />
      </div>
      <div className="fade-in">
        <Navigation />
      </div>
    </div>
  );
}
