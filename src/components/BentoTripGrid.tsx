"use client";

import type { TripRow } from "@/types/trip";
import TripCard from "./TripCard";

interface BentoTripGridProps {
  trips: TripRow[];
}

interface TripGroup {
  label: string;
  trips: TripRow[];
}

function groupTripsByTimeframe(trips: TripRow[]): TripGroup[] {
  const now = new Date();
  const inOneMonth = new Date(now);
  inOneMonth.setMonth(inOneMonth.getMonth() + 1);
  const inSixMonths = new Date(now);
  inSixMonths.setMonth(inSixMonths.getMonth() + 6);

  const nextMonth: TripRow[] = [];
  const nextSixMonths: TripRow[] = [];
  const later: TripRow[] = [];

  // Sort all trips by start_date ascending first
  const sorted = [...trips].sort((a, b) => {
    const da = a.trip.start_date ? new Date(a.trip.start_date).getTime() : Infinity;
    const db = b.trip.start_date ? new Date(b.trip.start_date).getTime() : Infinity;
    return da - db;
  });

  for (const trip of sorted) {
    const startDate = trip.trip.start_date
      ? new Date(trip.trip.start_date)
      : null;

    if (!startDate) {
      later.push(trip);
    } else if (startDate <= inOneMonth) {
      nextMonth.push(trip);
    } else if (startDate <= inSixMonths) {
      nextSixMonths.push(trip);
    } else {
      later.push(trip);
    }
  }

  const groups: TripGroup[] = [];
  if (nextMonth.length > 0) groups.push({ label: "Coming Up", trips: nextMonth });
  if (nextSixMonths.length > 0) groups.push({ label: "Next 6 Months", trips: nextSixMonths });
  if (later.length > 0) groups.push({ label: "Later", trips: later });

  return groups;
}

function TripScrollRow({ group, staggerOffset, priorityCount }: { group: TripGroup; staggerOffset: number; priorityCount: number }) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-5 px-1">
        <h3 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          {group.label}
        </h3>
        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          {group.trips.length} trip{group.trips.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="trip-scroll-row">
        {group.trips.map((trip, i) => (
          <TripCard
            key={trip.id}
            trip={trip}
            size="standard"
            priority={i < priorityCount}
            className={`page-enter stagger-${Math.min(i + staggerOffset, 6)} trip-scroll-card`}
          />
        ))}
      </div>
    </section>
  );
}

export default function BentoTripGrid({ trips }: BentoTripGridProps) {
  const groups = groupTripsByTimeframe(trips);

  let staggerOffset = 1;
  let priorityBudget = 4; // Eager-load first 4 card images (above the fold)
  return (
    <div>
      {groups.map((group) => {
        const offset = staggerOffset;
        staggerOffset += Math.min(group.trips.length, 3);
        const pCount = Math.min(group.trips.length, priorityBudget);
        priorityBudget -= pCount;
        return (
          <TripScrollRow key={group.label} group={group} staggerOffset={offset} priorityCount={pCount} />
        );
      })}
    </div>
  );
}
