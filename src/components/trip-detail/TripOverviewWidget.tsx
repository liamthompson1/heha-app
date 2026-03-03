"use client";

import type { TripRow } from "@/types/trip";
import type { BestArea } from "@/types/trip-content";
import Link from "next/link";

interface TripOverviewWidgetProps {
  trip: TripRow;
  bestAreas?: BestArea[];
}

function OverviewItem({ label, value, tripId, field }: { label: string; value?: string; tripId: string; field: string }) {
  if (!value) {
    return (
      <div className="overview-item">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </span>
        <Link
          href={`/trip/new?tripId=${tripId}&collect=${field}`}
          className="text-sm font-medium"
          style={{ color: "var(--blue)" }}
        >
          Add →
        </Link>
      </div>
    );
  }

  return (
    <div className="overview-item">
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export default function TripOverviewWidget({ trip, bestAreas }: TripOverviewWidgetProps) {
  return (
    <>
      <div className="widget-section">
        <div className="widget-header">
          <span style={{ fontSize: "1.25rem" }}>📋</span>
          <h2 className="widget-title">Trip Details</h2>
        </div>

        <div className="glass-panel overview-card">
          <OverviewItem label="Trip type" value={trip.trip.trip_type} tripId={trip.id} field="type" />
          <OverviewItem label="Budget" value={trip.preferences?.budget} tripId={trip.id} field="budget" />
          <OverviewItem label="Accommodation" value={trip.preferences?.accommodation_type} tripId={trip.id} field="accommodation" />
          <OverviewItem label="Pace" value={trip.preferences?.pace} tripId={trip.id} field="pace" />
          {trip.journey_locations?.origin && (
            <OverviewItem label="Travelling from" value={trip.journey_locations.origin} tripId={trip.id} field="origin" />
          )}
        </div>
      </div>

      {bestAreas && bestAreas.length > 0 && (
        <div className="widget-section">
          <div className="widget-header">
            <span style={{ fontSize: "1.25rem" }}>📍</span>
            <h2 className="widget-title">Best Areas to Stay</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bestAreas.map((area, i) => (
              <div key={i} className="glass-panel best-area-card">
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  {area.name}
                </h3>
                <p className="text-xs mb-2" style={{ color: "var(--teal)" }}>
                  {area.vibe}
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {area.good_for}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
