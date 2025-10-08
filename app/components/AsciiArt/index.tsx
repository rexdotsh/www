import Navigation from "../navigation";
import { asciiArt } from "./ascii-art";

const AsciiArt = () => (
  <div className="flex h-full flex-col items-center justify-center">
    <pre
      className="fade-in mx-auto select-none text-center text-[2.8px] text-rose-500 leading-[1.4px] md:text-[3.2px] md:leading-[1.6px]"
      style={{
        whiteSpace: "pre",
        fontFamily: 'monospace, "Courier New", Courier',
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
