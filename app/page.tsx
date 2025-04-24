import AsciiArt from '@/app/components/AsciiArt';
import Footer from '@/app/components/Footer';
import LocStats from '@/app/components/LocStats';
import SpotifyNowPlaying from '@/app/components/Spotify';

export default function Home() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <LocStats />
      <AsciiArt />
      <SpotifyNowPlaying />
      <Footer />
    </main>
  );
}
