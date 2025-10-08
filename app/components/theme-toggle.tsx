"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || forcedTheme) {
    return null;
  }

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  const switchTheme = () => setTheme(next);

  const handleToggle = () => {
    if (!document.startViewTransition) {
      switchTheme();
      return;
    }
    document.startViewTransition(switchTheme);
  };

  return (
    <button
      aria-label={`Switch to ${next} mode`}
      className="group fixed top-4 right-4 z-50 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-amber-900/60 transition-all duration-200 hover:text-amber-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-900/40 active:scale-95 dark:text-neutral-400 dark:focus-visible:ring-neutral-500 dark:hover:text-neutral-100"
      onClick={handleToggle}
      type="button"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      role="img"
      viewBox="0 0 24 24"
      width="18"
    >
      <title>Sun</title>
      <path
        d="M12 4V2m0 20v-2M4 12H2m20 0h-2M5.64 5.64 4.22 4.22m15.56 15.56-1.42-1.42M18.36 5.64l1.42-1.42M4.22 19.78l1.42-1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      role="img"
      viewBox="0 0 24 24"
      width="18"
    >
      <title>Moon</title>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
