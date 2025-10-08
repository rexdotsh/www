"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ViewTransitionLike = {
  ready?: Promise<unknown>;
  finished?: Promise<unknown>;
  updateCallbackDone?: Promise<unknown>;
};

type DocumentWithStartViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike;
};

export default function ThemeToggle() {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || forcedTheme) {
    return null;
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  const switchTheme = () => setTheme(nextTheme);

  const handleToggle = () => {
    const doc = document as DocumentWithStartViewTransition;
    const canStartViewTransition =
      typeof doc.startViewTransition === "function";
    if (!canStartViewTransition) {
      switchTheme();
      return;
    }
    try {
      doc.startViewTransition(() => {
        switchTheme();
      });
    } catch {
      // If view transitions throw or are blocked, still switch themes.
      switchTheme();
    }
  };

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={isDark}
      className="group fixed top-4 right-4 z-50 inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-900/40 active:scale-95 dark:focus-visible:ring-neutral-500"
      onClick={handleToggle}
      type="button"
    >
      <Image
        alt={isDark ? "Switch to light mode" : "Switch to dark mode"}
        height={48}
        priority
        src={isDark ? "/lever-1.png" : "/lever-2.png"}
        width={48}
      />
    </button>
  );
}
