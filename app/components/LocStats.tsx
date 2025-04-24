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
                   rounded-lg border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60 
                   text-xs md:text-sm transition-all duration-300
                   ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="text-neutral-400 group-hover:text-neutral-300 transition-colors">
          {stats.user_name}
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center text-green-400">
            <span className="mr-1">+</span>
            {formatNumber(stats.additions)}
          </span>
          <span className="inline-flex items-center text-red-400">
            <span className="mr-1">−</span>
            {formatNumber(stats.deletions)}
          </span>
        </div>
      </div>
    </div>
  );
}
