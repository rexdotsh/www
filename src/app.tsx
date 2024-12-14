import {Router} from "@solidjs/router";
import {FileRoutes} from "@solidjs/start/router";
import {Suspense} from "solid-js";
import "./app.css";
import Footer from "./components/Footer";
import SpotifyNowPlaying from "./components/Spotify";

export default function App() {
  return (
    <Router
      base={import.meta.env.SERVER_BASE_URL}
      root={(props) => (
        <main class="fixed inset-0 overflow-hidden">
          <Suspense>{props.children}</Suspense>
          <SpotifyNowPlaying />
          <Footer />
        </main>
      )}>
      <FileRoutes />
    </Router>
  );
}
