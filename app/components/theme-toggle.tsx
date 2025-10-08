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
      className="group fixed top-4 right-4 z-50 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent transition-all duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/40 active:scale-95 dark:focus-visible:ring-neutral-500"
      onClick={handleToggle}
      type="button"
    >
      <YinYang isDark={isDark} />
    </button>
  );
}

const YinYang = ({ isDark }: { isDark: boolean }) => {
  // done like this so it's actually readable. fuck this shit
  const COLORS = {
    cream: "#f2ecdf",
    red: "#be123c",
    dark: "#030303",
  };

  // this represents the light mode half: always cream, with red accent when in light mode
  const lightHalf = {
    fill: COLORS.cream,
    stroke: isDark ? COLORS.cream : COLORS.red,
  };

  // this represents the dark mode half: dark when in dark mode, red when in light mode
  const darkHalf = {
    fill: isDark ? COLORS.dark : COLORS.red,
    stroke: isDark ? COLORS.dark : COLORS.red,
  };

  return (
    <svg
      className="transition-transform duration-500 ease-in-out"
      fill="none"
      height="32"
      style={{ transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}
      viewBox="0 0 100 100"
      width="32"
    >
      <title>{isDark ? "Dark mode" : "Light mode"}</title>
      <circle
        cx="50"
        cy="50"
        fill={lightHalf.fill}
        r="48"
        stroke={lightHalf.stroke}
        strokeWidth="2"
      />
      <path
        d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2"
        fill={darkHalf.fill}
        stroke={darkHalf.stroke}
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="25"
        fill={darkHalf.fill}
        r="6"
        stroke={darkHalf.stroke}
        strokeWidth="1"
      />
      <circle
        cx="50"
        cy="75"
        fill={lightHalf.fill}
        r="6"
        stroke={lightHalf.stroke}
        strokeWidth="1"
      />
    </svg>
  );
};
