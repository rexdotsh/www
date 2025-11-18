import Footer from "@/app/components/footer";
import Navigation from "@/app/components/navigation";
import AsciiArt from "@/app/components/rose-ascii";
import SpotifyNowPlaying from "@/app/components/spotify";

export default function Home() {
  return (
    <main className="min-h-screen w-full p-4 md:p-8 lg:p-12 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-[1600px] mx-auto">
        {/* Header / Title Block */}
        <header className="lg:col-span-3 flex flex-col justify-between h-full min-h-[200px] lg:min-h-[80vh]">
          <div>
            <h1 className="text-6xl md:text-8xl lg:text-[8vw] xl:text-9xl font-serif-display font-bold tracking-tighter leading-none break-words">
              REX<span className="text-accent">.</span>WF
            </h1>
            <p className="mt-4 font-mono text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Est. 2024
              <br />
              Vol. 1 — Digital Garden
            </p>
          </div>

          <div className="hidden lg:block">
            <Footer />
          </div>
        </header>

        {/* Main Visual Block */}
        <section className="lg:col-span-6 flex flex-col items-center justify-center py-12 lg:py-0 border-y border-border lg:border-y-0 lg:border-x">
          <AsciiArt />
        </section>

        {/* Navigation / TOC Block */}
        <aside className="lg:col-span-3 flex flex-col justify-between h-full">
          <div className="mb-12 lg:mb-0">
            <h2 className="font-mono text-xs uppercase tracking-widest mb-4 text-gray-500 border-b border-border pb-2">
              Index
            </h2>
            <Navigation />
          </div>

          {/* Spotify Player */}
          <div className="mt-auto">
            <h2 className="font-mono text-xs uppercase tracking-widest mb-4 text-gray-500 border-b border-border pb-2">
              Audio Log
            </h2>
            <SpotifyNowPlaying />
          </div>
        </aside>
      </div>

      <div className="lg:hidden mt-12">
        <Footer />
      </div>
    </main>
  );
}
