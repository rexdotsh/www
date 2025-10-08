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
      className="group fixed top-4 right-4 z-50 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent transition-all duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/40 active:scale-95 dark:focus-visible:ring-neutral-500"
      onClick={handleToggle}
      type="button"
    >
      <YinYang isDark={isDark} />
    </button>
  );
}

const YinYang = ({ isDark }: { isDark: boolean }) => {
  // Dark mode: white light half, dark dark half
  // Light mode: cream/red light half, red dark half
  const [light, dark] = isDark
    ? ["var(--primary)", "var(--background)"]
    : ["var(--background)", "var(--primary)"];

  return (
    <svg
      className="transition-transform duration-500 ease-in-out"
      fill="none"
      height="16"
      style={{ transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}
      viewBox="0 0 100 100"
      width="16"
    >
      <title>{isDark ? "Dark mode" : "Light mode"}</title>
      <circle
        cx="50"
        cy="50"
        fill={light}
        r="48"
        stroke="var(--primary)"
        strokeWidth="2"
      />
      <path
        d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2"
        fill={dark}
        stroke={dark}
        strokeWidth="2"
      />
      <circle cx="50" cy="25" fill={dark} r="6" stroke={dark} strokeWidth="1" />
      <circle
        cx="50"
        cy="75"
        fill={light}
        r="6"
        stroke="var(--primary)"
        strokeWidth="1"
      />
    </svg>
  );
};
