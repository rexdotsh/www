import Footer from "@/app/components/footer";
import AsciiArt from "@/app/components/rose-ascii";
import SpotifyNowPlaying from "@/app/components/spotify";

export default function Home() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <AsciiArt />
      <SpotifyNowPlaying />
      <Footer />
    </main>
  );
}
