import Footer from "@/components/footer";
import RoseAscii from "@/components/rose-ascii";
import SpotifyNowPlaying from "@/components/spotify";
import ThemeToggle from "@/components/theme-toggle";

/** the original site, untouched — design "0" */
export default function ClassicDesign({ hostname }: { hostname: string }) {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <h1 className="sr-only">
        {hostname === "mridul.sh" ? "mridul's space" : "rex's space"}
      </h1>
      <RoseAscii hostname={hostname} />
      <SpotifyNowPlaying />
      <div className="hidden md:block">
        <Footer />
      </div>
      <ThemeToggle />
    </main>
  );
}
