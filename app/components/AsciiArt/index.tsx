import Image from "next/image";
import Navigation from "../navigation";

const AsciiArt = () => (
  <div className="flex h-full flex-col items-center justify-center">
    <div className="fade-in ml-6 w-full max-w-xs lg:mx-auto lg:max-w-xs">
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
