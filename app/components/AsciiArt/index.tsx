import Image from "next/image";
import Navigation from "../navigation";

const AsciiArt = () => (
  <div className="flex h-full flex-col items-center justify-center">
    <div className="fade-in ml-8 w-full max-w-[260px] lg:mx-auto">
      <Image
        alt="Rose"
        className="h-auto w-full select-none"
        height={260}
        priority
        src="/rose.webp"
        width={260}
      />
    </div>
    <div className="fade-in">
      <Navigation />
    </div>
  </div>
);

export default AsciiArt;
