import { useEffect, useState } from "react";
import type { WeatherReport } from "@/routes/api/weather";

const POLL_INTERVAL = 10 * 60 * 1000;
// the rose is up and settled before the sky is asked about
const FIRST_ASK = 1800;

export function useWeather() {
  const [report, setReport] = useState<WeatherReport | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const ask = async () => {
      try {
        const response = await fetch("/api/weather", {
          signal: controller.signal,
        });
        if (response.ok) {
          setReport((await response.json()) as WeatherReport);
        }
      } catch {
        // offline or aborted; the sky can wait
      }
      if (!controller.signal.aborted) {
        timer = setTimeout(ask, POLL_INTERVAL);
      }
    };

    const onVisibility = () => {
      clearTimeout(timer);
      if (!document.hidden) {
        ask();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    timer = setTimeout(ask, FIRST_ASK);

    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return report;
}
