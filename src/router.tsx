import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    // Page changes only: a TOC or heading link would cross-fade the whole post.
    defaultViewTransition: {
      types: ({ pathChanged }) => (pathChanged ? [] : false),
    },
    notFoundMode: "root",
    scrollRestoration: true,
    scrollRestorationBehavior: "instant",
  });
}
