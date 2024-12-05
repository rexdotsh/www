import {Component} from "solid-js";
import {useAsciiArt} from "./hooks/useAsciiArt";
import Navigation from "./Navigation";
import {AsciiArtProps} from "./types";

const AsciiArt: Component<AsciiArtProps> = (props) => {
  const {art} = useAsciiArt(props.imagePath, props.maxWidth, props.maxHeight);

  return (
    <div class="h-full flex justify-center flex-col items-center">
      <pre
        class="select-none text-[2.8px] md:text-[3.2px] leading-[1.4px] md:leading-[1.6px] 
            text-rose-400/80 text-center mx-auto">
        {art()}
      </pre>
      <Navigation />
    </div>
  );
};

export default AsciiArt;
