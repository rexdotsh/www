import {createEffect, createSignal, onMount} from "solid-js";
import {convertToAscii} from "../utils";
import {useWindowSize} from "./useWindowSize";

export const useAsciiArt = (imagePath: string, defaultMaxWidth = 500, defaultMaxHeight = 1000) => {
  const [art, setArt] = createSignal("");
  const {width: windowWidth} = useWindowSize();

  onMount(() => {
    createEffect(() => {
      const img = new Image();
      img.src = imagePath;

      img.onload = () => {
        const isMobile = windowWidth() < 768;
        const maxWidth = isMobile ? 300 : defaultMaxWidth;
        const maxHeight = isMobile ? 600 : defaultMaxHeight;

        setArt(convertToAscii(img, maxWidth, maxHeight));
      };
    });
  });

  return {art, windowWidth};
};
