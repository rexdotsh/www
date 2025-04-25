'use client';

import { useCallback, useEffect, useState } from 'react';

interface LocStats {
  user_name: string;
  additions: number;
  deletions: number;
  net: number;
  duration_seconds: string;
  last_updated_unix: number;
}

export default function LocStats() {
  const [stats, setStats] = useState<LocStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/loc');
      const data = await res.json();
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (stats) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [stats]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (!stats) return null;

  return (
    <div className="fixed top-6 left-0 right-0 flex justify-center w-full px-4 z-10">
      <div
        className={`group flex items-center gap-3 bg-neutral-900/50 backdrop-blur-sm py-1.5 px-3 
                   border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60 
                   text-xs md:text-sm transition-all duration-300
                   ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 group-hover:text-neutral-300 transition-colors">
            diff
          </span>
          <div
            className="relative flex items-center"
            onMouseEnter={() => setIsTooltipOpen(true)}
            onMouseLeave={() => setIsTooltipOpen(false)}
            onClick={() => setIsTooltipOpen(!isTooltipOpen)}
            onFocus={() => setIsTooltipOpen(true)}
            onBlur={() => setIsTooltipOpen(false)}
            role="button"
            tabIndex={0}
            aria-describedby="loc-tooltip"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors cursor-help"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
            <div
              id="loc-tooltip"
              role="tooltip"
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 px-2.5 py-1.5
                          bg-neutral-800 text-neutral-200 text-[10px] rounded-lg
                          transition-all duration-200 pointer-events-none z-20
                          border border-neutral-700 backdrop-blur-sm
                          ${isTooltipOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full
                            border-4 border-transparent border-b-neutral-800"
              />
              total lines of code added and removed by me across all repos
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center text-rose-400/80">
            <span className="mr-1">+</span>
            {formatNumber(stats.additions)}
          </span>
          <span className="inline-flex items-center text-neutral-400">
            <span className="mr-1">−</span>
            {formatNumber(stats.deletions)}
          </span>
        </div>
      </div>
    </div>
  );
}
