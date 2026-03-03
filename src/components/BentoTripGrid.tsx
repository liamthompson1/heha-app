"use client";

import type { TripRow } from "@/types/trip";
import TripCard, { type TripCardSize } from "./TripCard";

interface BentoTripGridProps {
  trips: TripRow[];
}

/** Sort trips by start_date ascending (soonest first), undated last. */
function sortByProximity(trips: TripRow[]): TripRow[] {
  const now = Date.now();
  return [...trips].sort((a, b) => {
    const da = a.trip.start_date ? new Date(a.trip.start_date).getTime() : Infinity;
    const db = b.trip.start_date ? new Date(b.trip.start_date).getTime() : Infinity;
    // Past trips sort after future trips
    const fa = da < now ? da + 1e15 : da;
    const fb = db < now ? db + 1e15 : db;
    return fa - fb;
  });
}

/** Assign card size based on index and days until trip. */
function getCardSize(trip: TripRow, index: number): TripCardSize {
  if (index === 0) return "large";

  const startDate = trip.trip.start_date;
  if (!startDate) return "compact";

  const daysUntil = Math.max(
    0,
    (new Date(startDate).getTime() - Date.now()) / 86400000
  );

  if (daysUntil < 30) return "large";
  if (daysUntil < 90) return "standard";
  return "compact";
}

export default function BentoTripGrid({ trips }: BentoTripGridProps) {
  const sorted = sortByProximity(trips);

  return (
    <div className="bento-trip-grid">
      {sorted.map((trip, i) => (
        <TripCard
          key={trip.id}
          trip={trip}
          size={getCardSize(trip, i)}
          className={`page-enter stagger-${Math.min(i + 1, 6)}`}
        />
      ))}
    </div>
  );
}
