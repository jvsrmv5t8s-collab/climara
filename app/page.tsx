"use client";

import {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  getCityById,
  searchCities,
  type City,
} from "@/data/cities";
import { CityCard } from "@/components/CityPolaroidCard";
import { useWeatherForCities } from "@/lib/useWeatherForCities";
import { useTypedPlaceholder } from "@/lib/useTypedPlaceholder";
import { usePostHog } from "posthog-js/react";

// ─── Storage ─────────────────────────────────────────────────────────────────

const SLOTS_KEY = "climara-slots-v2";

interface SlotState {
  center: string | null;
  left: string | null;
  right: string | null;
}

const EMPTY_SLOTS: SlotState = { center: null, left: null, right: null };

function loadSlots(): SlotState {
  if (typeof window === "undefined") return EMPTY_SLOTS;
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) return EMPTY_SLOTS;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "center" in parsed
    ) {
      return parsed as SlotState;
    }
    return EMPTY_SLOTS;
  } catch {
    return EMPTY_SLOTS;
  }
}

function persistSlots(s: SlotState): void {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

// ─── Add-city search panel ────────────────────────────────────────────────────

function AddCityPanel({
  onAdd,
  onClose,
  excludeIds,
}: {
  onAdd: (id: string) => void;
  onClose: () => void;
  excludeIds: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const typedCity = useTypedPlaceholder();
  const posthog = usePostHog();

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setListOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const found = searchCities(query, 12);
    return found.filter((c) => !excludeIds.has(c.id));
  }, [query, excludeIds]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#faf9f5] px-6">
      {/* Blue logo */}
      <img
        src="/climara-logo.svg"
        alt="Climara"
        className="absolute top-[51px] left-1/2 -translate-x-1/2"
        width={106}
        height={24}
      />

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-10 right-10 flex size-9 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors text-lg"
      >
        ✕
      </button>

      {/* Search */}
      <div ref={wrapRef} className="relative w-full max-w-[730px]">
        <div className="flex h-[53px] w-full items-center rounded-3xl border border-[#d9d9d9] bg-[#fcfcfc] px-6">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setListOpen(true);
            }}
            onFocus={() => setListOpen(true)}
            placeholder=""
            autoComplete="off"
            autoFocus
            aria-label="Search a city"
            className="w-full bg-transparent text-base text-black outline-none"
            style={{ fontFamily: "var(--font-label)", fontWeight: 300 }}
          />
          {!query && (
            <span
              className="pointer-events-none absolute left-[26px] select-none text-base text-[#aaa]"
              aria-hidden
              style={{ fontFamily: "var(--font-label)", fontWeight: 300 }}
            >
              {typedCity}
            </span>
          )}
        </div>

        {listOpen && query.trim() && results.length > 0 ? (
          <ul className="absolute left-0 right-0 top-full z-10 mt-2 max-h-56 overflow-auto rounded-2xl border border-stone-200/60 bg-white/95 py-1 text-left text-sm shadow-lg">
            {results.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="w-full px-6 py-2.5 text-left hover:bg-stone-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    posthog?.capture('city_searched', { query });
                    onAdd(c.id);
                  }}
                  style={{ fontFamily: "var(--font-label)" }}
                >
                  <span className="font-medium text-stone-800">{c.name}</span>
                  <span className="font-light text-stone-400"> · {c.country}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {listOpen && query.trim() && results.length === 0 ? (
          <p className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl bg-white px-4 py-3 text-center text-sm text-stone-400 shadow-lg">
            No cities found.
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Add-slot button ──────────────────────────────────────────────────────────

function AddSlotButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add a city"
      className="group flex size-14 shrink-0 items-center justify-center rounded-full border border-stone-300/70 bg-stone-100/60 text-stone-400 transition-all hover:border-stone-400 hover:bg-stone-200/70 hover:text-stone-600"
    >
      <span className="text-2xl font-light leading-none">+</span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [slots, setSlots] = useState<SlotState>(EMPTY_SLOTS);
  const [addingSlot, setAddingSlot] = useState<"left" | "right" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const typedCity = useTypedPlaceholder();
  const posthog = usePostHog();

  useEffect(() => {
    queueMicrotask(() => {
      const loaded = loadSlots();
      const cityCount = [loaded.center, loaded.left, loaded.right].filter(Boolean).length;
      if (cityCount > 0) {
        posthog?.capture('session_restored', { city_count: cityCount });
      }
      setSlots(loaded);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!lastAddedId) return;
    const t = window.setTimeout(() => setLastAddedId(null), 550);
    return () => clearTimeout(t);
  }, [lastAddedId]);

  // Close landing-page search dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      )
        setListOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const hasCities = slots.center !== null;

  // All unique city IDs currently in slots
  const allIds = useMemo(
    () =>
      [slots.center, slots.left, slots.right].filter(
        (id): id is string => id !== null,
      ),
    [slots],
  );

  const addedSet = useMemo(() => new Set(allIds), [allIds]);

  const addedCities: City[] = useMemo(
    () => allIds.map((id) => getCityById(id)).filter((c): c is City => c !== undefined),
    [allIds],
  );

  const weatherById = useWeatherForCities(addedCities);

  // Landing page search results
  const searchResults = useMemo(() => {
    const found = searchCities(searchQuery, 12);
    return found.filter((c) => !addedSet.has(c.id));
  }, [searchQuery, addedSet]);

  // Add first (center) city from landing page
  const addFirstCity = useCallback((id: string) => {
    const city = getCityById(id);
    posthog?.capture('city_searched', { query: searchQuery });
    posthog?.capture('city_selected', { city_name: city?.name ?? id, slot_position: 'center' });
    const next: SlotState = { center: id, left: null, right: null };
    setSlots(next);
    persistSlots(next);
    setLastAddedId(id);
    setSearchQuery("");
    setListOpen(false);
  }, [posthog, searchQuery]);

  // Add city to a specific slot from the overlay
  const addCityToSlot = useCallback(
    (id: string) => {
      if (!addingSlot) return;
      const city = getCityById(id);
      posthog?.capture('city_selected', {
        city_name: city?.name ?? id,
        slot_position: addingSlot,
      });
      setSlots((prev) => {
        const next = { ...prev, [addingSlot]: id };
        persistSlots(next);
        return next;
      });
      setLastAddedId(id);
      setAddingSlot(null);
    },
    [addingSlot, posthog],
  );

  // Remove a city from its slot
  const removeFromSlot = useCallback(
    (slot: "center" | "left" | "right") => {
      const cityId = slots[slot];
      const city = cityId ? getCityById(cityId) : null;
      posthog?.capture('city_removed', {
        city_name: city?.name ?? cityId ?? 'unknown',
        slot_position: slot,
      });
      setSlots((prev) => {
        let next: SlotState;
        if (slot !== "center") {
          next = { ...prev, [slot]: null };
        } else if (prev.left !== null) {
          // Promote left to center
          next = { center: prev.left, left: null, right: prev.right };
        } else if (prev.right !== null) {
          // Promote right to center
          next = { center: prev.right, left: null, right: null };
        } else {
          // No other cities — go back to landing page
          next = EMPTY_SLOTS;
        }
        persistSlots(next);
        return next;
      });
    },
    [posthog, slots],
  );

  const openSlot = useCallback(
    (position: 'left' | 'right') => {
      posthog?.capture('slot_opened', { slot_position: position });
      setAddingSlot(position);
    },
    [posthog],
  );

  // ── Landing page ────────────────────────────────────────────────────────────
  if (!hasCities) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#faf9f5] px-6 pb-[10vh]">
        <img
          src="/sky-bg.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <img
          src="/climara-logo-white.svg"
          alt="Climara"
          className="absolute top-[51px] left-1/2 -translate-x-1/2"
          width={106}
          height={24}
        />
        <h1
          className="relative z-10 text-center text-[40px] font-normal leading-snug text-[#777]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Add cities to see their weather and local time
        </h1>
        <div ref={searchWrapRef} className="relative z-10 mt-8 w-full max-w-[730px]">
          <div className="flex h-[53px] w-full items-center rounded-3xl border border-[#d9d9d9] bg-[#fcfcfc] px-6">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setListOpen(true);
              }}
              onFocus={() => setListOpen(true)}
              placeholder=""
              autoComplete="off"
              aria-label="Search a city"
              className="w-full bg-transparent text-base text-black outline-none"
              style={{ fontFamily: "var(--font-label)", fontWeight: 300 }}
            />
            {!searchQuery && (
              <span
                className="pointer-events-none absolute left-[26px] select-none text-base text-[#aaa]"
                aria-hidden
                style={{ fontFamily: "var(--font-label)", fontWeight: 300 }}
              >
                {typedCity}
              </span>
            )}
          </div>
          {listOpen && searchQuery.trim() && searchResults.length > 0 ? (
            <ul className="absolute left-0 right-0 top-full z-10 mt-2 max-h-56 overflow-auto rounded-2xl border border-stone-200/60 bg-white/95 py-1 text-left text-sm shadow-lg">
              {searchResults.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-6 py-2.5 text-left hover:bg-stone-50"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addFirstCity(c.id)}
                    style={{ fontFamily: "var(--font-label)" }}
                  >
                    <span className="font-medium text-stone-800">{c.name}</span>
                    <span className="font-light text-stone-400"> · {c.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {listOpen && searchQuery.trim() && searchResults.length === 0 ? (
            <p className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl bg-white px-4 py-3 text-center text-sm text-stone-400 shadow-lg">
              No cities found.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  // ── City pages ──────────────────────────────────────────────────────────────
  const centerCity = getCityById(slots.center!)!;
  const leftCity = slots.left ? getCityById(slots.left) ?? null : null;
  const rightCity = slots.right ? getCityById(slots.right) ?? null : null;

  return (
    <>
      {/* Add-city overlay */}
      {addingSlot !== null && (
        <AddCityPanel
          onAdd={addCityToSlot}
          onClose={() => setAddingSlot(null)}
          excludeIds={addedSet}
        />
      )}

      <div className="min-h-dvh bg-[#faf9f5] flex flex-col items-center justify-center px-6 py-16">
        {/* ── Desktop fan layout ── */}
        <div className="hidden sm:flex mx-auto w-full max-w-5xl items-center justify-center gap-16">

          {/* Left slot */}
          {leftCity ? (
            <div className="shrink-0 w-[360px]">
              <CityCard
                variant="live"
                size="standard"
                city={leftCity}
                weather={weatherById[leftCity.id]}
                animateEnter={lastAddedId === leftCity.id}
                onRemove={() => removeFromSlot("left")}
              />
            </div>
          ) : (
            <AddSlotButton onClick={() => openSlot("left")} />
          )}

          {/* Center (featured) */}
          <div className="shrink-0 w-[480px]">
            <CityCard
              variant="live"
              size="featured"
              city={centerCity}
              weather={weatherById[centerCity.id]}
              animateEnter={lastAddedId === centerCity.id}
              onRemove={() => removeFromSlot("center")}
            />
          </div>

          {/* Right slot */}
          {rightCity ? (
            <div className="shrink-0 w-[360px]">
              <CityCard
                variant="live"
                size="standard"
                city={rightCity}
                weather={weatherById[rightCity.id]}
                animateEnter={lastAddedId === rightCity.id}
                onRemove={() => removeFromSlot("right")}
              />
            </div>
          ) : (
            <AddSlotButton onClick={() => openSlot("right")} />
          )}

        </div>

        {/* ── Mobile stacked layout ── */}
        <div className="sm:hidden flex flex-col items-center gap-6 w-full">
          <CityCard
            variant="live"
            size="featured"
            city={centerCity}
            weather={weatherById[centerCity.id]}
            animateEnter={lastAddedId === centerCity.id}
            onRemove={() => removeFromSlot("center")}
          />
          {leftCity && (
            <CityCard
              variant="live"
              size="standard"
              city={leftCity}
              weather={weatherById[leftCity.id]}
              animateEnter={lastAddedId === leftCity.id}
              onRemove={() => removeFromSlot("left")}
            />
          )}
          {rightCity && (
            <CityCard
              variant="live"
              size="standard"
              city={rightCity}
              weather={weatherById[rightCity.id]}
              animateEnter={lastAddedId === rightCity.id}
              onRemove={() => removeFromSlot("right")}
            />
          )}
          <div className="flex gap-4">
            {!leftCity && <AddSlotButton onClick={() => openSlot("left")} />}
            {!rightCity && <AddSlotButton onClick={() => openSlot("right")} />}
          </div>
        </div>
      </div>
    </>
  );
}
