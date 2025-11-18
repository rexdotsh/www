import Footer from "@/app/components/footer";
import Navigation from "@/app/components/navigation";
import AsciiArt from "@/app/components/rose-ascii";
import SpotifyNowPlaying from "@/app/components/spotify";

export default function Home() {
  return (
    <main className="min-h-screen w-full p-4 md:p-8 lg:p-12 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-[1600px] mx-auto">
        {/* Header / Title Block */}
        <header className="lg:col-span-3 flex flex-col justify-between h-full min-h-[200px] lg:min-h-[80vh] relative z-20">
          <div>
            {/* 
               "The Correction" Layout
               'mridul' is crossed out in red.
               'REX' uses a 'halo' stroke to punch through the grid lines, breaking containment.
            */}
            <h1 className="flex flex-col items-start font-serif-display tracking-tighter select-none">
              <span className="relative px-2 text-4xl md:text-5xl lg:text-6xl italic text-gray-400 font-serif">
                mridul
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <title>Strikethrough</title>
                  <path
                    d="M -5 60 L 105 40"
                    vectorEffect="non-scaling-stroke"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.8"
                  />
                </svg>
              </span>
              <span
                className="text-[10rem] md:text-[12rem] lg:text-[14rem] xl:text-[16rem] font-bold leading-[0.8] -ml-2 mt-2 text-primary relative"
                style={{
                  WebkitTextStroke: "16px var(--background)",
                  paintOrder: "stroke fill",
                }}
              >
                REX
              </span>
            </h1>

            <div className="mt-12 pl-2 border-l-2 border-accent/30">
              <p className="font-mono text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Est. 2024
                <br />
                Vol. 1 — Digital Garden
              </p>
            </div>
          </div>

          <div className="hidden lg:block">
            <Footer />
          </div>
        </header>

        {/* Main Visual Block */}
        <section className="lg:col-span-6 flex flex-col items-center justify-center py-12 lg:py-0 border-y border-border lg:border-y-0 lg:border-x relative z-10">
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
