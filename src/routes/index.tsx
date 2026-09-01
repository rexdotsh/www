import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import Footer from "@/components/footer";
import RoseAscii from "@/components/rose-ascii";
import SpotifyNowPlaying from "@/components/spotify";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  component: Home,
  headers: () => ({
    "Cache-Control":
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  }),
});

function Home() {
  const { hostname } = rootRoute.useLoaderData();

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
    </main>
  );
}
