import {Router} from "@solidjs/router";
import {FileRoutes} from "@solidjs/start/router";
import {Suspense} from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      base={import.meta.env.SERVER_BASE_URL}
      root={(props) => (
        <main class="min-h-screen overflow-hidden">
          <Suspense>{props.children}</Suspense>
        </main>
      )}>
      <FileRoutes />
    </Router>
  );
}