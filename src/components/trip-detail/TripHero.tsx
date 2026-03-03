"use client";

import { useState } from "react";

interface TripHeroProps {
  destination: string;
  dateRange: string;
  tripType?: string;
  tripId: string;
  imageUrl?: string | null;
}

export default function TripHero({ destination, dateRange, tripType, tripId, imageUrl }: TripHeroProps) {
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");

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
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none" style={{ color: "#fff" }}>
          {destination}
        </h1>
        {dateRange && (
          <p className="mt-3 text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.7)" }}>
            {dateRange}
          </p>
        )}
      </div>
    </div>
  );
}
