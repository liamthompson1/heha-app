"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { TripRow } from "@/types/trip";

interface TripCardProps {
  trip: TripRow;
  size: "featured" | "standard";
  className?: string;
}

export default function TripCard({ trip, size, className }: TripCardProps) {
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  const destination = trip.trip.destination;
  const dateRange = [trip.trip.start_date, trip.trip.end_date]
    .filter(Boolean)
    .join(" – ");
  const tripType = trip.trip.trip_type;
  const travelerCount = trip.people_travelling.length;

  return (
    <Link
      href={`/trip/${trip.id}`}
      className={clsx(
        "trip-card",
        size === "featured" ? "trip-card-featured" : "trip-card-standard",
        className
      )}
    >
      {/* Background image */}
      {imgState === "loading" && <div className="trip-card-skeleton" />}
      {imgState === "error" && <div className="trip-card-gradient-fallback" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/images/destination?place=${encodeURIComponent(destination)}`}
        alt=""
        className="trip-card-img"
        onLoad={() => setImgState("loaded")}
        onError={() => setImgState("error")}
        style={{ display: imgState === "error" ? "none" : "block" }}
      />

      {/* Overlay gradient for text readability */}
      <div className="trip-card-overlay" />

      {/* Content */}
      <div className="trip-card-content">
        <h3
          className={clsx(
            "font-semibold truncate",
            size === "featured" ? "text-xl sm:text-2xl" : "text-lg"
          )}
          style={{ color: "var(--foreground)" }}
        >
          {destination}
        </h3>

        {dateRange && (
          <p
            className="text-sm mt-1"
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
