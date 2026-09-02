import { createFileRoute } from "@tanstack/react-router";
import { HOME } from "@/lib/content";

type Sky = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

export interface Weather {
  isDay: boolean;
  // mm in the last hour
  rain: number;
  sky: Sky;
  snow: number;
  temp: number;
  // km/h, and the direction it blows from, degrees clockwise from north
  wind: number;
  windFrom: number;
}

export interface WeatherReport {
  // where i am
  mine: Weather | null;
  // where the visitor is, from cloudflare's coarse geo; null when unknown
  yours: Weather | null;
}

const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";
const CURRENT = [
  "temperature_2m",
  "rain",
  "showers",
  "snowfall",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
  "is_day",
].join(",");
// upstream is cached at the edge per rounded cell; the response itself is
// per visitor so it only lives in their browser
const UPSTREAM_TTL = 600;
const CACHE_CONTROL = "private, max-age=600";

interface OpenMeteoResponse {
  current?: {
    is_day: number;
    rain: number;
    showers: number;
    snowfall: number;
    temperature_2m: number;
    weather_code: number;
    wind_direction_10m: number;
    wind_speed_10m: number;
  };
}

// wmo weather interpretation codes, folded to what the rose can show
const skyFor = (code: number): Sky => {
  if (code >= 95) {
    return "storm";
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return "snow";
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "rain";
  }
  if (code === 45 || code === 48) {
    return "fog";
  }
  if (code >= 2) {
    return "cloudy";
  }
  return "clear";
};

async function fetchWeather(
  lat: number,
  lon: number,
  signal: AbortSignal
): Promise<Weather | null> {
  const url = new URL(OPEN_METEO);
  url.searchParams.set("latitude", lat.toFixed(2));
  url.searchParams.set("longitude", lon.toFixed(2));
  url.searchParams.set("current", CURRENT);
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "UTC");
  const response = await fetch(url, {
    signal,
    cf: { cacheTtl: UPSTREAM_TTL, cacheEverything: true },
  } as RequestInit);
  if (!response.ok) {
    return null;
  }
  const { current } = (await response.json()) as OpenMeteoResponse;
  if (!current) {
    return null;
  }
  return {
    isDay: current.is_day === 1,
    rain: current.rain + current.showers,
    sky: skyFor(current.weather_code),
    snow: current.snowfall,
    temp: current.temperature_2m,
    wind: current.wind_speed_10m,
    windFrom: current.wind_direction_10m,
  };
}

// cloudflare's coarse position for the visitor, rounded to about ten
// kilometres. it is read, used for one upstream call, and never kept
function visitorCell(request: Request) {
  const { cf } = request as Request & { cf?: Record<string, unknown> };
  const lat = Number(
    cf?.latitude ?? request.headers.get("cf-iplatitude") ?? Number.NaN
  );
  const lon = Number(
    cf?.longitude ?? request.headers.get("cf-iplongitude") ?? Number.NaN
  );
  if (!(Number.isFinite(lat) && Number.isFinite(lon))) {
    return null;
  }
  return { lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 };
}

export const Route = createFileRoute("/api/weather")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const cell = visitorCell(request);
          const [mine, yours] = await Promise.all([
            fetchWeather(HOME.lat, HOME.lon, request.signal),
            cell
              ? fetchWeather(cell.lat, cell.lon, request.signal)
              : Promise.resolve(null),
          ]);
          const report: WeatherReport = { mine, yours };
          return Response.json(report, {
            headers: { "Cache-Control": CACHE_CONTROL },
          });
        } catch {
          return Response.json(
            { mine: null, yours: null } satisfies WeatherReport,
            { headers: { "Cache-Control": "no-store" } }
          );
        }
      },
    },
  },
});
