import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
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
}
