"use client";

import { useEffect, useState } from "react";
import type { City } from "@/data/cities";
import { fetchCurrentWeather, type CurrentWeather } from "@/lib/weather";

export type WeatherState =
  | { status: "loading" }
  | { status: "ok"; data: CurrentWeather }
  | { status: "error" };

export function useWeatherForCities(cities: City[]): Record<string, WeatherState> {
  const [byId, setById] = useState<Record<string, WeatherState>>({});

  const signature = cities
    .map((c) => `${c.id}:${c.latitude},${c.longitude}`)
    .sort()
    .join("|");

  useEffect(() => {
    let cancelled = false;

    const next: Record<string, WeatherState> = {};
    for (const c of cities) {
      next[c.id] = { status: "loading" };
    }
    setById(next);

    void (async () => {
      const results = await Promise.all(
        cities.map(async (c) => {
          const data = await fetchCurrentWeather(c.latitude, c.longitude);
          return { id: c.id, data } as const;
        }),
      );

      if (cancelled) return;

      setById((prev) => {
        const merged = { ...prev };
        for (const { id, data } of results) {
          merged[id] = data
            ? { status: "ok", data }
            : { status: "error" };
        }
        return merged;
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `signature` captures visible city set + coords
  }, [signature]);

  return byId;
}
