import AsciiArt from "@/app/components/AsciiArt";
import Footer from "@/app/components/footer";
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
