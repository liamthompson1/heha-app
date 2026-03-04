"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface TripHeroProps {
  destination: string;
  dateRange: string;
  tripType?: string;
  tripId: string;
  imageUrl?: string | null;
  onDestinationChange?: (name: string) => void;
}

export default function TripHero({ destination, dateRange, tripType, tripId, imageUrl, onDestinationChange }: TripHeroProps) {
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(destination);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== destination) {
      onDestinationChange?.(trimmed);
    } else {
      setDraft(destination);
    }
    setEditing(false);
  }, [draft, destination, onDestinationChange]);

  // Use persisted image if available, otherwise generate via trip-specific endpoint
  const imgSrc = imageUrl || `/api/trips/${tripId}/image`;

  return (
    <div className="trip-hero">
      {imgState === "loading" && <div className="trip-hero-skeleton" />}
      {imgState === "error" && <div className="trip-hero-fallback" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={destination}
        className="trip-hero-img"
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          if (img.naturalWidth === 0) {
            setImgState("error");
          } else {
            setImgState("loaded");
          }
        }}
        onError={() => setImgState("error")}
        style={{ display: imgState === "error" ? "none" : "block" }}
      />
      <div className="trip-hero-overlay" />
      <div className="trip-hero-content">
        {tripType && (
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            {tripType}
          </p>
        )}
        {editing ? (
          <input
            ref={inputRef}
            className="trip-hero-name-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") { setDraft(destination); setEditing(false); }
            }}
            onBlur={save}
          />
        ) : (
          <h1
            className="trip-hero-name"
            onClick={() => { setDraft(destination); setEditing(true); }}
          >
            {destination}
          </h1>
        )}
        {dateRange && (
          <p className="mt-3 text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.7)" }}>
            {dateRange}
          </p>
        )}
      </div>
    </div>
  );
}
