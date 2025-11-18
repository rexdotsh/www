import Footer from "@/app/components/footer";
import Navigation from "@/app/components/navigation";
import RoseAscii from "@/app/components/rose-ascii";
import SpotifyNowPlaying from "@/app/components/spotify";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background text-primary selection:bg-accent selection:text-white">
      <SpotifyNowPlaying />

      <main className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-6 pt-24 pb-6 md:px-12 md:pt-32">
        <header className="mb-16 flex flex-col items-start justify-between gap-4 border-b border-primary pb-8 md:mb-24 md:flex-row md:items-end md:pb-12">
          <h1 className="font-black text-[12vw] leading-[0.8] tracking-tighter md:text-[10vw] lg:text-[180px]">
            REX<span className="text-accent">.</span>
          </h1>
          <div className="flex flex-col items-start gap-2 text-right md:items-end">
            <span className="font-bold text-sm tracking-widest uppercase md:text-base">
              Software Engineer
            </span>
            <span className="font-medium text-secondary text-xs tracking-widest uppercase md:text-sm">
              Based in the Cloud
            </span>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
          <div className="flex flex-col justify-between lg:col-span-7">
            <Navigation />
            <div className="mt-12 hidden lg:block">
              <Footer />
            </div>
          </div>

          <div className="flex flex-col items-center gap-12 lg:col-span-5 lg:items-end lg:justify-start">
            <div className="w-full max-w-md lg:sticky lg:top-32">
              <RoseAscii />
              <p className="mt-8 font-medium text-secondary text-sm leading-relaxed uppercase tracking-wide">
                Exploring the intersection of code, design, and user experience.
                Building things that break the mold.
              </p>
            </div>
            <div className="block w-full lg:hidden">
              <Footer />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
