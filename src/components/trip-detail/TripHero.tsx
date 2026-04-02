"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface TripHeroProps {
  destination: string;
  dateRange: string;
  tripType?: string;
  tripId: string;
  imageUrl?: string | null;
  isHxTrip?: boolean;
  onDestinationChange?: (name: string) => void;
  onImageRegenerated?: (newUrl: string) => void;
}

export default function TripHero({
  destination,
  dateRange,
  tripType,
  tripId,
  imageUrl,
  isHxTrip,
  onDestinationChange,
  onImageRegenerated,
}: TripHeroProps) {
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(destination);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Regen state
  const [showRegenUI, setShowRegenUI] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [imgVersion, setImgVersion] = useState(0);
  const regenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      (mobileInputRef.current || desktopInputRef.current)?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (showRegenUI) regenInputRef.current?.focus();
  }, [showRegenUI]);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== destination) {
      onDestinationChange?.(trimmed);
    } else {
      setDraft(destination);
    }
    setEditing(false);
  }, [draft, destination, onDestinationChange]);

  const handleRegenerate = useCallback(
    async (instructions?: string) => {
      setRegenerating(true);
      setShowRegenUI(false);
      setImgState("loading");
      try {
        const res = await fetch(`/api/trips/${tripId}/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instructions: instructions || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setImgVersion((v) => v + 1);
            onImageRegenerated?.(data.imageUrl);
          }
        }
      } catch {
        // Silent fail
      } finally {
        setRegenerating(false);
        setRegenInstructions("");
      }
    },
    [tripId, onImageRegenerated]
  );

  // Use persisted image if available, otherwise generate via trip-specific endpoint
  const baseSrc = imageUrl || `/api/trips/${tripId}/image`;
  const imgSrc = imgVersion > 0 ? `${baseSrc}${baseSrc.includes("?") ? "&" : "?"}v=${imgVersion}` : baseSrc;

  return (
    <>
      {/* ── Mobile compact header ── shown on mobile, hidden on desktop */}
      <div className="trip-compact-header">
        <div className="trip-compact-info">
          {editing ? (
            <input
              ref={mobileInputRef}
              className="trip-compact-name-input"
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
              className="trip-compact-name"
              onClick={() => { setDraft(destination); setEditing(true); }}
            >
              {destination}
            </h1>
          )}
          {dateRange && (
            <span className="trip-compact-dates">{dateRange}</span>
          )}
        </div>
        {tripType && (
          <span className="trip-compact-type">{tripType}</span>
        )}
      </div>

      {/* ── Desktop full hero ── hidden on mobile */}
      <div className="trip-hero">
        {(imgState === "loading" || regenerating) && <div className="trip-hero-skeleton" />}
        {imgState === "error" && !regenerating && <div className="trip-hero-fallback" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={destination}
          className="trip-hero-img"
          fetchPriority="high"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.naturalWidth === 0) {
              setImgState("error");
            } else {
              setImgState("loaded");
            }
          }}
          onError={() => setImgState("error")}
          style={{ display: imgState === "error" || regenerating ? "none" : "block" }}
        />
        <div className="trip-hero-overlay" />

        {/* Regen button */}
        <button
          className="trip-hero-regen-btn"
          onClick={() => setShowRegenUI(true)}
          title="Regenerate image"
          aria-label="Regenerate image"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
          </svg>
        </button>

        {/* Regen panel */}
        {showRegenUI && (
          <div className="trip-hero-regen-panel">
            <input
              ref={regenInputRef}
              type="text"
              className="trip-hero-regen-input"
              placeholder="e.g. sunset beach, snowy mountains…"
              value={regenInstructions}
              onChange={(e) => setRegenInstructions(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRegenerate(regenInstructions);
                if (e.key === "Escape") {
                  setShowRegenUI(false);
                  setRegenInstructions("");
                }
              }}
            />
            <div className="trip-hero-regen-actions">
              <button
                className="trip-hero-regen-go"
                onClick={() => handleRegenerate(regenInstructions)}
              >
                Generate
              </button>
              <button
                className="trip-hero-regen-surprise"
                onClick={() => handleRegenerate()}
              >
                Surprise me
              </button>
              <button
                className="trip-hero-regen-cancel"
                onClick={() => {
                  setShowRegenUI(false);
                  setRegenInstructions("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isHxTrip && (
          <img src="/hx-sandcastle.png" alt="Holiday Extras" className="hx-badge hx-badge-hero" />
        )}
        <div className="trip-hero-content">
          {tripType && (
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
              {tripType}
            </p>
          )}
          {editing ? (
            <input
              ref={desktopInputRef}
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
    </>
  );
}
