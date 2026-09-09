import { StartClient } from "@tanstack/react-start/client";
import { StrictMode, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";

// Start's default entry suspends at the root while hydration data streams in.
// React can suspend a bare root; Preact needs a boundary or the promise escapes.
hydrateRoot(
  document,
  <StrictMode>
    <Suspense fallback={null}>
      <StartClient />
    </Suspense>
  </StrictMode>
);
