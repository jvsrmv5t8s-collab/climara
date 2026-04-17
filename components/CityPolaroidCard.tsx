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
      connectionName: string;
      connectionPhoto: string;
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
    return (
      <SampleCard
        name={props.name}
        imageSeed={props.imageSeed}
        priority={props.priority}
      />
    );
  }
  return (
    <LiveCard
      size={props.size}
      city={props.city}
      weather={props.weather}
      connectionName={props.connectionName}
      connectionPhoto={props.connectionPhoto}
      animateEnter={props.animateEnter}
      onRemove={props.onRemove}
    />
  );
}

function SampleCard({
  name,
  imageSeed,
  priority = false,
}: {
  name: string;
  imageSeed: string;
  priority?: boolean;
}) {
  const [src, onError] = useCityImageSrc(imageSeed);
  return (
    <article
      className="relative overflow-hidden rounded-2xl w-[200px] h-[260px] select-none shrink-0"
      aria-hidden
    >
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

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function LiveCard({
  size,
  city,
  weather,
  connectionName,
  connectionPhoto,
  animateEnter,
  onRemove,
}: {
  size: "featured" | "standard";
  city: City;
  weather: WeatherState | undefined;
  connectionName: string;
  connectionPhoto: string;
  animateEnter?: boolean;
  onRemove?: () => void;
}) {
  const localTime = useLiveLocalTime12h(city.timezone);
  const [src, onError] = useCityImageSrc(city.id);

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
    animateEnter ? "somewher-card-enter" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const paddingClass = isFeatured ? "p-6" : "p-[18px]";
  const avatarSize = isFeatured ? "size-14" : "size-10";
  const avatarText = isFeatured ? "text-base" : "text-xs";
  const tempClass = isFeatured ? "text-[150px]" : "text-[clamp(4rem,9vw,7rem)]";
  const labelClass = isFeatured ? "text-[18px]" : "text-[14px]";

  return (
    <article className={cardClasses}>
      <div className="relative aspect-[13/20]">
        {/* City background */}
        <Image
          src={src}
          alt={city.name}
          fill
          className="object-cover"
          sizes={isFeatured ? "480px" : "360px"}
          loading={isFeatured ? "eager" : "lazy"}
          onError={onError}
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className={`absolute inset-0 flex flex-col justify-between ${paddingClass}`}>

          {/* Top: avatar + person name */}
          <div className="flex flex-col items-center gap-2">
            <div className={`${avatarSize} rounded-full overflow-hidden ring-2 ring-white/40 shrink-0`}>
              {connectionPhoto ? (
                <img
                  src={connectionPhoto}
                  alt={connectionName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center bg-white/20 text-white font-medium ${avatarText}`}
                  style={{ fontFamily: "var(--font-label)" }}
                >
                  {getInitials(connectionName)}
                </div>
              )}
            </div>
            <p
              className="text-white text-[18px] leading-none"
              style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
            >
              {connectionName}
            </p>
          </div>

          {/* Center: city name + temperature */}
          <div className="flex flex-col items-center gap-2">
            <p
              className={`text-center text-white uppercase leading-none tracking-[1.6px] ${isFeatured ? "text-[28px]" : "text-[22px]"}`}
              style={{ fontFamily: "var(--font-label)", fontWeight: 300 }}
            >
              {city.name}
            </p>
            <p
              className={`text-center text-white leading-none ${tempClass}`}
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {tempDisplay}
            </p>
          </div>

          {/* Bottom: time + high/low */}
          <div className="flex justify-between items-center">
            <span
              className={`text-white ${labelClass}`}
              style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
            >
              {localTime}
            </span>
            <span
              className={`text-white ${labelClass}`}
              style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
            >
              {highLowDisplay}
            </span>
          </div>
        </div>

        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${connectionName}`}
            className="absolute top-3 right-3 size-7 flex items-center justify-center rounded-full bg-black/30 text-white/70 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity hover:bg-black/50 hover:text-white text-xs"
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
