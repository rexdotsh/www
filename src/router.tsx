import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    // Page changes only: a TOC or heading link would cross-fade the whole post.
    // TanStack only asks when the browser has transition types; without them,
    // skip transitions rather than run one for every hash change.
    defaultViewTransition:
      typeof CSS === "undefined" ||
      CSS.supports("selector(:active-view-transition-type(a))")
        ? { types: ({ pathChanged }) => (pathChanged ? [] : false) }
        : false,
    notFoundMode: "root",
    scrollRestoration: true,
    scrollRestorationBehavior: "instant",
  });

  // An intent preload fetches a route's code and data but not its head links,
  // so its stylesheets and fonts only start loading on click, and the page
  // can't commit until they're in. Prefetch, not preload: a hover that never
  // clicks would leave an unused preload, which chrome warns about.
  const preloadRoute = router.preloadRoute;
  router.preloadRoute = async (options) => {
    const matches = await preloadRoute(options);
    for (const { links = [] } of matches ?? []) {
      for (const link of links) {
        if (
          link?.href &&
          (link.rel === "stylesheet" || link.rel === "preload") &&
          !document.head.querySelector(`link[href="${link.href}"]`)
        ) {
          const prefetch = document.createElement("link");
          prefetch.rel = "prefetch";
          prefetch.href = link.href;
          if (link.crossOrigin) prefetch.crossOrigin = link.crossOrigin;
          document.head.appendChild(prefetch);
        }
      }
    }
    return matches;
  };

  return router;
}
