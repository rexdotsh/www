"use client";

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
      className="group fixed bottom-6 right-6 z-50 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all duration-300 hover:scale-110 hover:border-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-95 md:h-12 md:w-12"
      onClick={handleToggle}
      type="button"
    >
      <YinYang isDark={isDark} />
    </button>
  );
}

const YinYang = ({ isDark }: { isDark: boolean }) => {
  const fillColor = "var(--primary)";

  return (
    <svg
      className="h-5 w-5 transition-transform duration-500 ease-in-out md:h-6 md:w-6"
      fill="none"
      style={{ transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{isDark ? "Dark mode" : "Light mode"}</title>
      {isDark ? (
        <path
          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          fill={fillColor}
        />
      ) : (
        <path
          d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
          fill={fillColor}
        />
      )}
    </svg>
  );
};
