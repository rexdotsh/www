import Image from "next/image";
import Navigation from "../navigation";

const AsciiArt = () => (
  <div className="flex h-full flex-col items-center justify-center">
    <div className="fade-in ascii-container select-none">
      <Image
        alt="Rose"
        className="h-auto w-full select-none"
        height={300}
        priority
        src="/rose.webp"
        width={300}
      />
    </div>
    <div className="fade-in">
      <Navigation />
    </div>
  </div>
);

export default AsciiArt;
