import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import Footer from "@/components/footer";
import RoseAscii from "@/components/rose-ascii";
import SpotifyNowPlaying from "@/components/spotify";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { hostname } = rootRoute.useLoaderData();

  return (
    <main className="fixed inset-0 overflow-hidden">
      <RoseAscii hostname={hostname} />
      <SpotifyNowPlaying />
      <div className="hidden md:block">
        <Footer />
      </div>
    </main>
  );
}
