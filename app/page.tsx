"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { getCityById, type City } from "@/data/cities";
import { CityCard } from "@/components/CityPolaroidCard";
import { AddConnectionFlow } from "@/components/AddConnectionFlow";
import { useWeatherForCities } from "@/lib/useWeatherForCities";
import type { Connection } from "@/lib/types";
import { usePostHog } from "posthog-js/react";

// ─── Storage ─────────────────────────────────────────────────────────────────

const SLOTS_KEY = "somewher-slots-v3";

interface SlotState {
  center: Connection | null;
  left: Connection | null;
  right: Connection | null;
}

const EMPTY_SLOTS: SlotState = { center: null, left: null, right: null };

function isConnection(v: unknown): v is Connection {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    typeof r.photo === "string" &&
    typeof r.cityId === "string"
  );
}

function loadSlots(): SlotState {
  if (typeof window === "undefined") return EMPTY_SLOTS;
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) return EMPTY_SLOTS;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || !("center" in parsed)) {
      return EMPTY_SLOTS;
    }
    const p = parsed as Record<string, unknown>;
    return {
      center: isConnection(p.center) ? p.center : null,
      left: isConnection(p.left) ? p.left : null,
      right: isConnection(p.right) ? p.right : null,
    };
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

// ─── Add-connection panel (modal overlay) ────────────────────────────────────

function AddConnectionPanel({
  onAdd,
  onClose,
  excludeCityIds,
}: {
  onAdd: (connection: Connection) => void;
  onClose: () => void;
  excludeCityIds: Set<string>;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-[560px] rounded-3xl bg-[#F1EDE5] px-10 py-16 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src="/Somewher_dark.svg"
          alt="Somewher"
          className="mx-auto mb-8"
          width={151}
          height={27}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors text-sm"
        >
          ✕
        </button>
        <AddConnectionFlow onComplete={onAdd} excludeCityIds={excludeCityIds} />
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
      aria-label="Add someone"
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
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const posthog = usePostHog();

  useEffect(() => {
    queueMicrotask(() => {
      const loaded = loadSlots();
      const count = [loaded.center, loaded.left, loaded.right].filter(
        Boolean,
      ).length;
      if (count > 0) {
        posthog?.capture("session_restored", { city_count: count });
      }
      setSlots(loaded);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!lastAddedId) return;
    const t = window.setTimeout(() => setLastAddedId(null), 550);
    return () => clearTimeout(t);
  }, [lastAddedId]);

  const hasCities = slots.center !== null;

  const allConnections = useMemo(
    () =>
      [slots.center, slots.left, slots.right].filter(
        (c): c is Connection => c !== null,
      ),
    [slots],
  );

  const allCityIds = useMemo(
    () => allConnections.map((c) => c.cityId),
    [allConnections],
  );

  const addedCityIdSet = useMemo(() => new Set(allCityIds), [allCityIds]);

  const addedCities: City[] = useMemo(
    () =>
      allCityIds
        .map((id) => getCityById(id))
        .filter((c): c is City => c !== undefined),
    [allCityIds],
  );

  const weatherById = useWeatherForCities(addedCities);

  const addFirstConnection = useCallback(
    (connection: Connection) => {
      const city = getCityById(connection.cityId);
      posthog?.capture("connection_added", {
        city_name: city?.name ?? connection.cityId,
        slot_position: "center",
      });
      const next: SlotState = { center: connection, left: null, right: null };
      setSlots(next);
      persistSlots(next);
      setLastAddedId(connection.id);
    },
    [posthog],
  );

  const addConnectionToSlot = useCallback(
    (connection: Connection) => {
      if (!addingSlot) return;
      const city = getCityById(connection.cityId);
      posthog?.capture("connection_added", {
        city_name: city?.name ?? connection.cityId,
        slot_position: addingSlot,
      });
      setSlots((prev) => {
        const next = { ...prev, [addingSlot]: connection };
        persistSlots(next);
        return next;
      });
      setLastAddedId(connection.id);
      setAddingSlot(null);
    },
    [addingSlot, posthog],
  );

  const removeFromSlot = useCallback(
    (slot: "center" | "left" | "right") => {
      const conn = slots[slot];
      const city = conn ? getCityById(conn.cityId) : null;
      posthog?.capture("connection_removed", {
        city_name: city?.name ?? conn?.cityId ?? "unknown",
        slot_position: slot,
      });
      setSlots((prev) => {
        let next: SlotState;
        if (slot !== "center") {
          next = { ...prev, [slot]: null };
        } else if (prev.left !== null) {
          next = { center: prev.left, left: null, right: prev.right };
        } else if (prev.right !== null) {
          next = { center: prev.right, left: null, right: null };
        } else {
          next = EMPTY_SLOTS;
        }
        persistSlots(next);
        return next;
      });
    },
    [posthog, slots],
  );

  const openSlot = useCallback(
    (position: "left" | "right") => {
      posthog?.capture("slot_opened", { slot_position: position });
      setAddingSlot(position);
    },
    [posthog],
  );

  // ── Landing page ────────────────────────────────────────────────────────────
  if (!hasCities) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-black px-6">
        <img
          src="/landing-bg-new.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/60" />
        <img
          src="/somewher-logo-new.svg"
          alt="Somewher"
          className="absolute top-[36px] sm:top-[50px] left-1/2 -translate-x-1/2 z-10 w-[100px] sm:w-[151px] h-auto"
          width={151}
          height={26}
        />
        <div className="relative z-10 w-full max-w-[730px]">
          <AddConnectionFlow
            onComplete={addFirstConnection}
            excludeCityIds={addedCityIdSet}
            dark
            tagline={<>Always know the time and weather<br className="hidden sm:block" /> for the people <em>you care about</em></>}
          />
        </div>
      </div>
    );
  }

  // ── Main view ───────────────────────────────────────────────────────────────
  const centerConn = slots.center!;
  const leftConn = slots.left;
  const rightConn = slots.right;

  const centerCity = getCityById(centerConn.cityId)!;
  const leftCity = leftConn ? (getCityById(leftConn.cityId) ?? null) : null;
  const rightCity = rightConn ? (getCityById(rightConn.cityId) ?? null) : null;

  return (
    <>
      {addingSlot !== null && (
        <AddConnectionPanel
          onAdd={addConnectionToSlot}
          onClose={() => setAddingSlot(null)}
          excludeCityIds={addedCityIdSet}
        />
      )}

      <div className="min-h-dvh bg-[#F1EDE5] flex flex-col items-center justify-center px-6 py-16">
        {/* ── Desktop fan layout ── */}
        <div className="hidden sm:flex mx-auto w-full max-w-5xl items-center justify-center gap-4 lg:gap-12 px-4">

          {leftCity && leftConn ? (
            <div className="flex-1 min-w-0 max-w-[360px]">
              <CityCard
                variant="live"
                size="standard"
                city={leftCity}
                weather={weatherById[leftCity.id]}
                connectionName={leftConn.name}
                connectionPhoto={leftConn.photo}
                animateEnter={lastAddedId === leftConn.id}
                onRemove={() => removeFromSlot("left")}
              />
            </div>
          ) : (
            <AddSlotButton onClick={() => openSlot("left")} />
          )}

          <div className="flex-[1.4] min-w-0 max-w-[480px]">
            <CityCard
              variant="live"
              size="featured"
              city={centerCity}
              weather={weatherById[centerCity.id]}
              connectionName={centerConn.name}
              connectionPhoto={centerConn.photo}
              animateEnter={lastAddedId === centerConn.id}
              onRemove={() => removeFromSlot("center")}
            />
          </div>

          {rightCity && rightConn ? (
            <div className="flex-1 min-w-0 max-w-[360px]">
              <CityCard
                variant="live"
                size="standard"
                city={rightCity}
                weather={weatherById[rightCity.id]}
                connectionName={rightConn.name}
                connectionPhoto={rightConn.photo}
                animateEnter={lastAddedId === rightConn.id}
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
            connectionName={centerConn.name}
            connectionPhoto={centerConn.photo}
            animateEnter={lastAddedId === centerConn.id}
            onRemove={() => removeFromSlot("center")}
          />
          {leftCity && leftConn && (
            <CityCard
              variant="live"
              size="standard"
              city={leftCity}
              weather={weatherById[leftCity.id]}
              connectionName={leftConn.name}
              connectionPhoto={leftConn.photo}
              animateEnter={lastAddedId === leftConn.id}
              onRemove={() => removeFromSlot("left")}
            />
          )}
          {rightCity && rightConn && (
            <CityCard
              variant="live"
              size="standard"
              city={rightCity}
              weather={weatherById[rightCity.id]}
              connectionName={rightConn.name}
              connectionPhoto={rightConn.photo}
              animateEnter={lastAddedId === rightConn.id}
              onRemove={() => removeFromSlot("right")}
            />
          )}
          {(!leftConn || !rightConn) && (
            <AddSlotButton onClick={() => openSlot(!leftConn ? "left" : "right")} />
          )}
        </div>
      </div>
    </>
  );
}
