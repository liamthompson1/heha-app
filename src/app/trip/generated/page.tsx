"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import type { TripData } from "@/types/trip";
import { dummyTripData } from "@/types/trip";

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <span style={{ color: 'var(--text-tertiary)' }}>{label}: </span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function TripGeneratedPage() {
  const [trip, setTrip] = useState<TripData>(dummyTripData);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("heha-trip-data");
      if (stored) setTrip(JSON.parse(stored));
    } catch {
      // fall back to dummy
    }
  }, []);

  const prefLabels = [
    trip.preferences.travel_insurance && "Travel Insurance",
    trip.preferences.airport_parking && "Airport Parking",
    trip.preferences.airport_lounge && "Airport Lounge",
    trip.preferences.car_hire && "Car Hire",
    trip.preferences.airport_transfers && "Airport Transfers",
    trip.preferences.extra_luggage && "Extra Luggage",
  ].filter(Boolean) as string[];

  return (
    <PageShell backHref="/trip/new">
      {/* Header */}
      <div className="page-enter stagger-1 mb-2">
        <h1 className="gradient-text text-4xl font-bold sm:text-5xl">
          {trip.name || "Your Trip"}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {[trip.dates.start_date, trip.dates.end_date].filter(Boolean).join(" – ")}
          {trip.reason && ` · ${trip.reason}`}
        </p>
      </div>

      <div className="page-enter stagger-2 prismatic-line w-full mb-8" />

      {/* Overview */}
      <GlassCard className="page-enter stagger-2 mb-5">
        <h2 className="text-lg font-semibold mb-3">Overview</h2>
        <div className="space-y-1">
          <InfoRow label="Trip name" value={trip.name} />
          <InfoRow label="Type" value={trip.reason} />
          <InfoRow label="Travel mode" value={trip.how_we_are_travelling} />
          {trip.dates.flexible_dates_notes && (
            <InfoRow label="Date notes" value={trip.dates.flexible_dates_notes} />
          )}
        </div>
      </GlassCard>

      {/* Travelers */}
      {trip.people_travelling.length > 0 && (
        <GlassCard className="page-enter stagger-3 mb-5">
          <h2 className="text-lg font-semibold mb-3">Travelers</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {trip.people_travelling.map((t, i) => (
              <div key={i} className="glass-panel rounded-xl p-4">
                <p className="font-medium">
                  {t.first_name} {t.last_name}
                </p>
                {t.email && <p className="text-xs mt-1">{t.email}</p>}
                {t.phone && <p className="text-xs">{t.phone}</p>}
                {t.dob && <p className="text-xs mt-1">DOB: {t.dob}</p>}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Journey */}
      <GlassCard className="page-enter stagger-3 mb-5">
        <h2 className="text-lg font-semibold mb-3">Journey</h2>
        <div className="space-y-1">
          <InfoRow
            label="From"
            value={[trip.journey_locations.travelling_from, trip.journey_locations.postcode_from].filter(Boolean).join(", ")}
          />
          <InfoRow
            label="To"
            value={[trip.journey_locations.travelling_to, trip.journey_locations.postcode_to].filter(Boolean).join(", ")}
          />
          <InfoRow label="Nearest airport" value={trip.journey_locations.nearest_airport} />
        </div>
      </GlassCard>

      {/* Flights */}
      {trip.flights_if_known.length > 0 && (
        <GlassCard className="page-enter stagger-4 mb-5">
          <h2 className="text-lg font-semibold mb-3">Flights</h2>
          <div className="space-y-3">
            {trip.flights_if_known.map((f, i) => (
              <div key={i} className="glass-panel rounded-xl p-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium">{f.airline} {f.flight_number}</span>
                  <span className="text-xs capitalize">{f.direction}</span>
                </div>
                <p className="text-sm">
                  {f.from_airport} → {f.to_airport}
                </p>
                <p className="text-xs mt-1">
                  Departs {f.departure_date} {f.departure_time} · Arrives {f.arrival_date} {f.arrival_time}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Preferences */}
      {(prefLabels.length > 0 || trip.preferences.notes) && (
        <GlassCard className="page-enter stagger-4 mb-5">
          <h2 className="text-lg font-semibold mb-3">Preferences</h2>
          {prefLabels.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {prefLabels.map((label) => (
                <span key={label} className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs text-blue-300">
                  {label}
                </span>
              ))}
            </div>
          )}
          {trip.preferences.notes && (
            <p className="text-sm">{trip.preferences.notes}</p>
          )}
        </GlassCard>
      )}

      {/* Anything else */}
      {trip.anything_else_we_should_know && (
        <GlassCard className="page-enter stagger-5 mb-5">
          <h2 className="text-lg font-semibold mb-3">Anything Else</h2>
          <p className="text-sm">{trip.anything_else_we_should_know}</p>
        </GlassCard>
      )}

      {/* Actions */}
      <div className="page-enter stagger-5 mt-8 flex flex-col gap-3 sm:flex-row">
        <GlassButton variant="teal" className="flex-1">
          Share Trip
        </GlassButton>
        <GlassButton href="/trip/new" variant="purple" className="flex-1">
          Plan Another
        </GlassButton>
      </div>
    </PageShell>
  );
}
