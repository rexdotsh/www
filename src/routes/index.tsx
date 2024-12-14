import {Component, Suspense} from "solid-js";
import AsciiArt from "../components/Art";
import Footer from "../components/Footer";
import SpotifyNowPlaying from "../components/Spotify";

const IndexPage: Component = () => {
  return (
    <main class="fixed inset-0 overflow-hidden">
      <Suspense>
        <AsciiArt />
      </Suspense>
      <SpotifyNowPlaying />
      <Footer />
    </main>
  );
};

export default IndexPage;
