"use client";

import { useEffect, useState } from "react";

/** Default tick interval for live clocks (ms). Change to 60_000 for per-minute updates. */
export const LIVE_TIME_INTERVAL_MS = 1000;

const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const timeFormatter12hCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string): Intl.DateTimeFormat {
  let f = timeFormatterCache.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    timeFormatterCache.set(timezone, f);
  }
  return f;
}

function getFormatter12h(timezone: string): Intl.DateTimeFormat {
  let f = timeFormatter12hCache.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    timeFormatter12hCache.set(timezone, f);
  }
  return f;
}

export function formatLocalTime(timezone: string, date: Date = new Date()): string {
  return getFormatter(timezone).format(date);
}

export function formatLocalTime12h(timezone: string, date: Date = new Date()): string {
  return getFormatter12h(timezone).format(date);
}

export function useLiveLocalTime(
  timezone: string,
  intervalMs: number = LIVE_TIME_INTERVAL_MS,
): string {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  // `tick` forces re-render; format uses current instant
  void tick;
  return formatLocalTime(timezone);
}

export function useLiveLocalTime12h(
  timezone: string,
  intervalMs: number = LIVE_TIME_INTERVAL_MS,
): string {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  void tick;
  return formatLocalTime12h(timezone);
}
