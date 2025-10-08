import Image from "next/image";
import rose from "@/public/rose.avif";
import Navigation from "./navigation";

export default function RoseAscii() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="fade-in ascii-container relative select-none">
        <Image
          alt="Rose"
          className="select-none object-contain"
          fill
          priority
          sizes="(min-width: 1667px) 300px, (min-width: 1024px) 260px, (min-width: 768px) 45vw, 70vw"
          src={rose}
        />
      </div>
      <div className="fade-in">
        <Navigation />
      </div>
    </div>
  );
}
