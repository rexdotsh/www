import AsciiArt from "@/app/components/AsciiArt";
import Footer from "@/app/components/Footer";
import SpotifyNowPlaying from "@/app/components/Spotify";

export default function Home() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <AsciiArt />
      <SpotifyNowPlaying />
      <Footer />
    </main>
  );
}
