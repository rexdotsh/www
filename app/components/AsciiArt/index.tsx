import Navigation from "../navigation";
import { asciiArt } from "./ascii-art";

const AsciiArt = () => (
  <div className="flex h-full flex-col items-center justify-center">
    <pre
      className="fade-in mx-auto select-none text-center text-[2.8px] text-rose-500 leading-[0.5] md:text-[3.2px]"
      style={{
        whiteSpace: "pre",
        fontFamily: 'monospace, "Courier New", Courier',
        WebkitTextSizeAdjust: "100%",
      }}
    >
      {asciiArt}
    </pre>
    <div className="fade-in">
      <Navigation />
    </div>
  </div>
);

export default AsciiArt;
