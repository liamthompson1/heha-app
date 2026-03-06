"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { TripRow } from "@/types/trip";
import { formatDateRange } from "@/lib/format-date";

export type TripCardSize = "hero" | "large" | "standard" | "compact" | "featured";

interface TripCardProps {
  trip: TripRow;
  size: TripCardSize;
  className?: string;
}

export default function TripCard({ trip, size, className }: TripCardProps) {
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  const destination = trip.trip.destination;
  const dateRange = formatDateRange(trip.trip.start_date, trip.trip.end_date);
  const tripType = trip.trip.trip_type;
  const travelerCount = trip.people_travelling.length;

  // Use persisted image if available, otherwise generate via trip-specific endpoint
  const imgSrc = trip.image_url || `/api/trips/${trip.id}/image`;

  const isLarge = size === "hero" || size === "large" || size === "featured";

  return (
    <Link
      href={`/trip/${trip.id}`}
      className={clsx(
        "trip-card",
        `trip-card-${size}`,
        className
      )}
    >
      {/* Background image */}
      {imgState === "loading" && <div className="trip-card-skeleton" />}
      {imgState === "error" && <div className="trip-card-gradient-fallback" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt=""
        className="trip-card-img"
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

      {/* Overlay gradient for text readability */}
      <div className="trip-card-overlay" />

      {/* HX badge */}
      {trip.traveller_trip_id && (
        <img src="/hx-sandcastle.png" alt="Holiday Extras" className="hx-badge" />
      )}

      {/* Content */}
      <div className="trip-card-content">
        <h3
          className={clsx(
            "font-semibold truncate",
            isLarge ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
          )}
          style={{ color: "var(--foreground)" }}
        >
          {destination}
        </h3>

        {dateRange && (
          <p
            className={clsx("mt-1", isLarge ? "text-sm" : "text-xs")}
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            {dateRange}
          </p>
        )}

        {(tripType || travelerCount > 0) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tripType && <span className="trip-card-tag">{tripType}</span>}
            {travelerCount > 0 && (
              <span className="trip-card-tag">
                {travelerCount} {travelerCount === 1 ? "traveler" : "travelers"}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
