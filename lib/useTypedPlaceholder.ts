"use client";

import { useEffect, useRef, useState } from "react";

const PLACEHOLDER_CITIES = [
  "Tokyo",
  "Paris",
  "Buenos Aires",
  "Toronto",
  "Medellín",
  "Lisbon",
  "Sydney",
  "New York",
  "Berlin",
  "Seoul",
  "London",
  "Mexico City",
];

type Phase = "typing" | "holding" | "deleting" | "pausing";

export function useTypedPlaceholder(
  cities: string[] = PLACEHOLDER_CITIES,
): string {
  const [cityIdx, setCityIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const word = cities[cityIdx % cities.length];

    if (timerRef.current) clearTimeout(timerRef.current);

    switch (phase) {
      case "typing":
        if (charCount < word.length) {
          timerRef.current = setTimeout(
            () => setCharCount((c) => c + 1),
            85,
          );
        } else {
          timerRef.current = setTimeout(() => setPhase("holding"), 1800);
        }
        break;

      case "holding":
        timerRef.current = setTimeout(() => setPhase("deleting"), 0);
        break;

      case "deleting":
        if (charCount > 0) {
          timerRef.current = setTimeout(
            () => setCharCount((c) => c - 1),
            45,
          );
        } else {
          timerRef.current = setTimeout(() => setPhase("pausing"), 0);
        }
        break;

      case "pausing":
        timerRef.current = setTimeout(() => {
          setCityIdx((i) => (i + 1) % cities.length);
          setPhase("typing");
        }, 350);
        break;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, charCount, cityIdx]);

  return cities[cityIdx % cities.length].slice(0, charCount);
}
