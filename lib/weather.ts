export type CurrentWeather = {
  temperatureC: number;
  conditionLabel: string;
  highC: number | null;
  lowC: number | null;
};

export const WEATHER_TTL_MS = 10 * 60 * 1000;

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

type CacheEntry = { data: CurrentWeather; fetchedAt: number };

const cache = new Map<string, CacheEntry>();

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

/** WMO Weather interpretation codes (Open-Meteo). */
export function weatherCodeToCondition(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code === 56 || code === 57) return "Freezing drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code === 66 || code === 67) return "Freezing rain";
  if (code >= 71 && code <= 75) return "Snow";
  if (code === 77) return "Snow grains";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if (code === 96 || code === 99) return "Thunderstorm with hail";
  return "Unknown";
}

type OpenMeteoCurrent = {
  temperature_2m?: number;
  weather_code?: number;
};

type OpenMeteoDaily = {
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
  daily?: OpenMeteoDaily;
};

export async function fetchCurrentWeather(
  lat: number,
  lon: number,
  now: number = Date.now(),
): Promise<CurrentWeather | null> {
  const key = cacheKey(lat, lon);
  const hit = cache.get(key);
  if (hit && now - hit.fetchedAt < WEATHER_TTL_MS) {
    return hit.data;
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "1",
  });

  try {
    const res = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`);
    if (!res.ok) return null;
    const json = (await res.json()) as OpenMeteoResponse;
    const c = json.current;
    if (
      c?.temperature_2m === undefined ||
      c.weather_code === undefined
    ) {
      return null;
    }
    const data: CurrentWeather = {
      temperatureC: c.temperature_2m,
      conditionLabel: weatherCodeToCondition(c.weather_code),
      highC: json.daily?.temperature_2m_max?.[0] ?? null,
      lowC: json.daily?.temperature_2m_min?.[0] ?? null,
    };
    cache.set(key, { data, fetchedAt: now });
    return data;
  } catch {
    return null;
  }
}

/** For tests or forcing refresh */
export function clearWeatherCache(): void {
  cache.clear();
}
