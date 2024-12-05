import {Component} from "solid-js";
import {useAsciiArt} from "./hooks/useAsciiArt";
import Navigation from "./Navigation";
import {AsciiArtProps} from "./types";

const AsciiArt: Component<AsciiArtProps> = (props) => {
  const {art} = useAsciiArt(props.imagePath, props.maxWidth, props.maxHeight);

  return (
    <div class="h-full flex justify-center flex-col items-center">
      {/* very weird bug that i cannot figure out, it is very dull on mobile, but fine on PC, even through devtools.
      if i set it app.tsx to `fixed`, it becomes dull on pc too???? idk, maybe this shit needs a re-write
      as a workaround, using text-rose-500 on mobile and text-rose-400/80 on pc. 
      looks atrocious on mobile through devtools, but looks fine on my actual phone. wtf
       */}
      <pre
        class="select-none text-[2.8px] md:text-[3.2px] leading-[1.4px] md:leading-[1.6px] 
            text-rose-500 md:text-rose-400/80 text-center mx-auto">
        {art()}
      </pre>
      <Navigation />
    </div>
  );
};

export default AsciiArt;
