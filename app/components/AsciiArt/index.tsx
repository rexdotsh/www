import Image from "next/image";
import Navigation from "../navigation";

const AsciiArt = () => (
  <div className="flex h-full flex-col items-center justify-center">
    <div className="fade-in mx-auto w-full max-w-[340px]">
      <Image
        alt="Rose"
        className="h-auto w-full select-none"
        height={370}
        priority
        src="/rose.webp"
        width={370}
      />
    </div>
    <div className="fade-in">
      <Navigation />
    </div>
  </div>
);

export default AsciiArt;
