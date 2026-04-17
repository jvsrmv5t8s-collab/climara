"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { searchCities } from "@/data/cities";
import { useTypedPlaceholder } from "@/lib/useTypedPlaceholder";
import { compressPhoto } from "@/lib/photo";
import type { Connection } from "@/lib/types";
import { usePostHog } from "posthog-js/react";

const PEOPLE_PLACEHOLDERS = [
  "Mom and Dad",
  "Sofia",
  "SF Team",
  "Abuela",
  "Jake",
  "London crew",
];

type Step = "name" | "photo" | "city";

const STEP_HEADINGS: Record<Step, string> = {
  name: "Add someone close to you",
  photo: "Add a photo of them (Optional)",
  city: "Where are they?",
};

const STEP_SUBHEADINGS: Partial<Record<Step, string>> = {};

interface AddConnectionFlowProps {
  onComplete: (connection: Connection) => void;
  excludeCityIds: Set<string>;
  dark?: boolean;
  tagline?: React.ReactNode;
}

export function AddConnectionFlow({
  onComplete,
  excludeCityIds,
  dark = false,
  tagline,
}: AddConnectionFlowProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [query, setQuery] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const typedName = useTypedPlaceholder(PEOPLE_PLACEHOLDERS);
  const typedCity = useTypedPlaceholder();

  const fileRef = useRef<HTMLInputElement>(null);
  const cityWrapRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const posthog = usePostHog();

  useEffect(() => {
    if (step === "name") nameInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        cityWrapRef.current &&
        !cityWrapRef.current.contains(e.target as Node)
      )
        setListOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const cityResults = useMemo(() => {
    const found = searchCities(query, 12);
    return found.filter((c) => !excludeCityIds.has(c.id));
  }, [query, excludeCityIds]);

  const listItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (highlightedIndex < 0) return;
    const list = listRef.current;
    const item = listItemRefs.current[highlightedIndex];
    if (!list || !item) return;

    if (highlightedIndex === 0) {
      list.scrollTop = 0;
      return;
    }
    if (highlightedIndex === cityResults.length - 1) {
      list.scrollTop = list.scrollHeight;
      return;
    }

    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (itemRect.top < listRect.top) {
      list.scrollTop += itemRect.top - listRect.top;
    } else if (itemRect.bottom > listRect.bottom) {
      list.scrollTop += itemRect.bottom - listRect.bottom;
    }
  }, [highlightedIndex, cityResults.length]);

  const stepIndex = step === "name" ? 0 : step === "photo" ? 1 : 2;

  function handleNameNext() {
    if (!name.trim()) return;
    posthog?.capture("connection_name_set");
    setStep("photo");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setIsProcessing(true);
    try {
      const compressed = await compressPhoto(file);
      setPhoto(compressed);
    } catch {
      setPhotoError("Couldn't load that image. Try another.");
    } finally {
      setIsProcessing(false);
    }
    // Reset file input so the same file can be re-selected if needed
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleCitySelect(cityId: string) {
    posthog?.capture("connection_city_selected", { city_id: cityId });
    const connection: Connection = {
      id: crypto.randomUUID(),
      name: name.trim(),
      photo,
      cityId,
    };
    onComplete(connection);
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Tagline — only on step 1 */}
      {tagline && step === "name" && (
        <h1
          className="mb-6 sm:mb-10 w-full lg:w-[900px] lg:max-w-[calc(100vw-48px)] text-center text-[32px] sm:text-[42px] lg:text-[54px] font-normal leading-snug text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {tagline}
        </h1>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === stepIndex
                ? dark ? "size-2 bg-white/80" : "size-2 bg-stone-500"
                : i < stepIndex
                  ? dark ? "size-1.5 bg-white/60" : "size-1.5 bg-stone-400"
                  : dark ? "size-1.5 bg-white/30" : "size-1.5 bg-stone-300"
            }`}
          />
        ))}
      </div>

      {/* Step heading */}
      <p
        className={`mb-1 text-center ${step === "name" ? "text-[15px] sm:text-[18px]" : "text-[17px] sm:text-[22px]"} ${dark ? "text-white/90" : "text-stone-500"}`}
        style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
      >
        {STEP_HEADINGS[step]}
      </p>
      {STEP_SUBHEADINGS[step] && (
        <p
          className={`mb-4 text-center text-sm ${dark ? "text-white/40" : "text-stone-400"}`}
          style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
        >
          {STEP_SUBHEADINGS[step]}
        </p>
      )}
      {!STEP_SUBHEADINGS[step] && <div className="mb-5" />}

      {/* ── Step 1: Name ──────────────────────────────────────────────────────── */}
      {step === "name" && (
        <div className="w-full">
          <div className="relative w-full">
            <div className="flex h-[53px] w-full items-center rounded-3xl border border-[#d9d9d9] bg-[#fcfcfc] px-6 pr-3">
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                autoComplete="off"
                className="w-full bg-transparent text-base sm:text-[18px] text-black outline-none"
                style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
              />
              {!name && (
                <span
                  className="pointer-events-none absolute left-[26px] select-none text-base sm:text-[18px] text-[#aaa]"
                  aria-hidden
                  style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
                >
                  {typedName}
                </span>
              )}
              <button
                type="button"
                onClick={handleNameNext}
                disabled={!name.trim()}
                className="shrink-0 ml-2 flex items-center justify-center size-9 rounded-full bg-stone-800 text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all hover:bg-stone-700"
                aria-label="Next"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Photo ─────────────────────────────────────────────────────── */}
      {step === "photo" && (
        <div className="flex flex-col items-center gap-5">
          <button
            type="button"
            onClick={() => !isProcessing && fileRef.current?.click()}
            disabled={isProcessing}
            className={`relative flex flex-col items-center justify-center transition-all group overflow-hidden ${
              photo
                ? "size-36 rounded-full ring-4 ring-white/60 shadow-lg"
                : "w-44 h-44 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 hover:border-stone-400"
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="size-6 rounded-full border-2 border-stone-300 border-t-stone-600 animate-spin" />
              </div>
            ) : photo ? (
              <img
                src={photo}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <span className="text-4xl text-stone-300 group-hover:text-stone-400 transition-colors mb-2 leading-none">
                  +
                </span>
                <span
                  className="text-xs text-stone-400 text-center px-4 leading-relaxed"
                  style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
                >
                  A selfie, a group shot,
                  <br />
                  whatever feels right
                </span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {photoError && (
            <p
              className="text-sm text-red-400"
              style={{ fontFamily: "var(--font-label)" }}
            >
              {photoError}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("name")}
              className={`px-6 py-2.5 rounded-full text-sm transition-colors ${dark ? "bg-white/15 text-white hover:bg-white/25 border-2 border-white/30" : "border border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-700"}`}
              style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
            >
              ← Back
            </button>
            {!photo && (
              <button
                type="button"
                onClick={() => setStep("city")}
                className={`px-6 py-2.5 rounded-full text-sm transition-colors ${dark ? "bg-white/15 text-white hover:bg-white/25 border-2 border-white/30" : "border border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-700"}`}
                style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
              >
                Skip
              </button>
            )}
            {photo && !isProcessing && (
              <button
                type="button"
                onClick={() => setStep("city")}
                className={`px-8 py-2.5 rounded-full text-sm transition-colors ${dark ? "bg-white text-stone-800 hover:bg-stone-100" : "text-white bg-stone-700 hover:bg-stone-800"}`}
                style={{ fontFamily: "var(--font-label)" }}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: City ──────────────────────────────────────────────────────── */}
      {step === "city" && (
        <div className="flex flex-col items-center gap-5 w-full">
          <div ref={cityWrapRef} className="relative w-full">
            <div className="flex h-[53px] w-full items-center rounded-3xl border border-[#d9d9d9] bg-[#fcfcfc] px-6 pr-3">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedCityId(null);
                  setListOpen(true);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const len = cityResults.length;
                    if (len === 0) return;
                    setListOpen(true);
                    setHighlightedIndex((i) =>
                      i < 0 || i >= len - 1 ? 0 : i + 1,
                    );
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const len = cityResults.length;
                    if (len === 0) return;
                    setListOpen(true);
                    setHighlightedIndex((i) => (i <= 0 ? len - 1 : i - 1));
                    return;
                  }
                  if (e.key === "Enter") {
                    const c = cityResults[highlightedIndex];
                    if (listOpen && c) {
                      e.preventDefault();
                      setQuery(c.name);
                      setSelectedCityId(c.id);
                      setHighlightedIndex(-1);
                      setListOpen(false);
                      return;
                    }
                    if (selectedCityId) {
                      e.preventDefault();
                      handleCitySelect(selectedCityId);
                    }
                    return;
                  }
                  if (e.key === "Escape") {
                    setListOpen(false);
                    setHighlightedIndex(-1);
                  }
                }}
                onFocus={() => setListOpen(true)}
                autoFocus
                autoComplete="off"
                aria-label="Search a city"
                className="w-full bg-transparent text-base sm:text-[18px] text-black outline-none"
                style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
              />
              {!query && (
                <span
                  className="pointer-events-none absolute left-[26px] select-none text-base sm:text-[18px] text-[#aaa]"
                  aria-hidden
                  style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
                >
                  {typedCity}
                </span>
              )}
              <button
                type="button"
                onClick={() => selectedCityId && handleCitySelect(selectedCityId)}
                disabled={!selectedCityId}
                className="shrink-0 ml-2 flex items-center justify-center size-9 rounded-full bg-stone-800 text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all hover:bg-stone-700"
                aria-label="Confirm city"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {listOpen && query.trim() && cityResults.length > 0 && (
              <ul
                ref={listRef}
                className="absolute left-0 right-0 top-full z-10 mt-2 max-h-56 overflow-auto rounded-2xl border border-stone-200/60 bg-white/95 py-1 text-left text-sm shadow-lg"
              >
                {cityResults.map((c, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        ref={(el) => {
                          listItemRefs.current[idx] = el;
                        }}
                        className={`w-full px-6 py-2.5 text-left transition-colors ${isHighlighted ? "bg-stone-200" : "hover:bg-stone-100"}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onClick={() => {
                          setQuery(c.name);
                          setSelectedCityId(c.id);
                          setHighlightedIndex(-1);
                          setListOpen(false);
                        }}
                        style={{ fontFamily: "var(--font-label)" }}
                      >
                        <span className="font-medium text-stone-800">
                          {c.name}
                        </span>
                        <span className="font-light text-stone-400">
                          {" "}
                          · {c.country}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {listOpen && query.trim() && cityResults.length === 0 && (
              <p className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl bg-white px-4 py-3 text-center text-sm text-stone-400 shadow-lg">
                No cities found.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setStep("photo")}
            className={`px-6 py-2.5 rounded-full text-sm transition-colors ${dark ? "bg-white/15 text-white hover:bg-white/25 border-2 border-white/30" : "border border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-700"}`}
            style={{ fontFamily: "var(--font-label)", fontWeight: 400 }}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
