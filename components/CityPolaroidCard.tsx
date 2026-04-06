"use client";

import Image from "next/image";
import { useState } from "react";
import type { City } from "@/data/cities";
import { useLiveLocalTime12h } from "@/lib/time";
import type { WeatherState } from "@/lib/useWeatherForCities";

function localImageSrc(id: string): string {
  return `/cities/${id}/bg.jpg`;
}

function fallbackImageSrc(id: string): string {
  return `https://picsum.photos/seed/climara-${encodeURIComponent(id)}/800/1000`;
}

function useCityImageSrc(id: string): [string, () => void] {
  const [useFallback, setUseFallback] = useState(false);
  const src = useFallback ? fallbackImageSrc(id) : localImageSrc(id);
  return [src, () => setUseFallback(true)];
}

export type CityCardProps =
  | {
      variant: "live";
      size: "featured" | "standard";
      city: City;
      weather: WeatherState | undefined;
      animateEnter?: boolean;
      onRemove?: () => void;
    }
  | {
      variant: "sample";
      name: string;
      imageSeed: string;
      priority?: boolean;
    };

export function CityCard(props: CityCardProps) {
  if (props.variant === "sample") {
    return <SampleCard name={props.name} imageSeed={props.imageSeed} priority={props.priority} />;
  }
  return (
    <LiveCard
      size={props.size}
      city={props.city}
      weather={props.weather}
      animateEnter={props.animateEnter}
      onRemove={props.onRemove}
    />
  );
}

function SampleCard({ name, imageSeed, priority = false }: { name: string; imageSeed: string; priority?: boolean }) {
  const [src, onError] = useCityImageSrc(imageSeed);
  return (
    <article className="relative overflow-hidden rounded-2xl w-[200px] h-[260px] select-none shrink-0" aria-hidden>
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="200px"
        priority={priority}
        onError={onError}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <p
          className="text-center text-white text-base font-light tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {name}
        </p>
        <p
          className="text-center text-white text-6xl font-light"
          style={{ fontFamily: "var(--font-display)" }}
        >
          —
        </p>
        <div className="flex justify-between">
          <span
            className="text-white/80 text-xs"
            style={{ fontFamily: "var(--font-label)", fontWeight: 300 }}
          >
            —:— —M
          </span>
          <span
            className="text-white/80 text-xs"
            style={{ fontFamily: "var(--font-label)", fontWeight: 300 }}
          >
            H:—° L:—°
          </span>
        </div>
      </div>
    </article>
  );
}

function LiveCard({
  size,
  city,
  weather,
  animateEnter,
  onRemove,
}: {
  size: "featured" | "standard";
  city: City;
  weather: WeatherState | undefined;
  animateEnter?: boolean;
  onRemove?: () => void;
}) {
  const localTime = useLiveLocalTime12h(city.timezone);
  const [imgSrc, onImgError] = useCityImageSrc(city.id);

  const isFeatured = size === "featured";

  let tempDisplay: string;
  let highLowDisplay: string;

  if (!weather || weather.status === "loading") {
    tempDisplay = "…";
    highLowDisplay = "H:—° L:—°";
  } else if (weather.status === "error") {
    tempDisplay = "—";
    highLowDisplay = "H:—° L:—°";
  } else {
    const { temperatureC, highC, lowC } = weather.data;
    tempDisplay = `${Math.round(temperatureC)}°`;
    const h = highC !== null ? Math.round(highC) : "—";
    const l = lowC !== null ? Math.round(lowC) : "—";
    highLowDisplay = `H:${h}° L:${l}°`;
  }

  const cardClasses = [
    "relative overflow-hidden select-none group",
    isFeatured ? "rounded-2xl" : "rounded-xl",
    isFeatured ? "w-[min(100%,480px)]" : "w-[min(100%,360px)]",
    animateEnter ? "climara-card-enter" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const paddingClass = isFeatured ? "p-6" : "p-[18px]";
  const cityNameClass = isFeatured ? "text-2xl" : "text-xl";
  const tempClass = isFeatured ? "text-[128px]" : "text-[clamp(4rem,9vw,6.5rem)]";
  const labelClass = "text-base";

  return (
    <article className={cardClasses}>
      <div className={isFeatured ? "relative aspect-[4/5]" : "relative aspect-[3/4]"}>
        <Image
          src={imgSrc}
          alt={city.name}
          fill
          className="object-cover"
          sizes={isFeatured ? "480px" : "360px"}
          loading={isFeatured ? "eager" : "lazy"}
          onError={onImgError}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div
          className={`absolute inset-0 flex flex-col justify-between ${paddingClass}`}
        >
          <p
            className={`text-center text-white font-light tracking-wide ${cityNameClass}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {city.name}
          </p>

          <p
            className={`text-center text-white font-light leading-none ${tempClass}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {tempDisplay}
          </p>

          <div className="flex justify-between items-end">
            <span
              className={`text-white/90 ${labelClass}`}
              style={{ fontFamily: "var(--font-label)", fontWeight: 300 }}
            >
              {localTime}
            </span>
            <span
              className={`text-white/90 ${labelClass}`}
              style={{ fontFamily: "var(--font-label)", fontWeight: 300 }}
            >
              {highLowDisplay}
            </span>
          </div>
        </div>

        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${city.name}`}
            className="absolute top-3 right-3 size-7 flex items-center justify-center rounded-full bg-black/30 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 hover:text-white text-xs"
          >
            ✕
          </button>
        ) : null}
      </div>
    </article>
  );
}

/** @deprecated Use CityCard instead */
export const CityPolaroidCard = CityCard;
