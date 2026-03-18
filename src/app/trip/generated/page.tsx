"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import type { TripData } from "@/types/trip";
import { dummyTripData } from "@/types/trip";
import { formatDateRange } from "@/lib/format-date";

function InfoItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </p>
      <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
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
    <PageShell backHref="/trip/new" variant="full" maxWidth="5xl">
      {/* ── Hero Section ── */}
      <section className="page-enter stagger-1 pt-4 pb-16 sm:pt-8 sm:pb-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
          {trip.reason || "Trip"}
        </p>
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-none gradient-text">
          {trip.name || "Your Trip"}
        </h1>
        <p className="mt-6 text-lg sm:text-xl" style={{ color: 'var(--text-secondary)' }}>
          {formatDateRange(trip.dates.start_date, trip.dates.end_date)}
        </p>
      </section>

      <div className="prismatic-line w-full max-w-5xl mx-auto" />

      {/* ── Info Grid ── */}
      <section className="page-enter stagger-2 w-full max-w-5xl mx-auto py-16 sm:py-24 grid gap-6 sm:gap-8 sm:grid-cols-2">
        {/* Overview */}
        <GlassCard size="lg">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            Overview
          </h2>
          <div className="space-y-5">
            <InfoItem label="Trip name" value={trip.name} />
            <InfoItem label="Type" value={trip.reason} />
            <InfoItem label="Travel mode" value={trip.how_we_are_travelling} />
            {trip.dates.flexible_dates_notes && (
              <InfoItem label="Date notes" value={trip.dates.flexible_dates_notes} />
            )}
          </div>
        </GlassCard>

        {/* Journey */}
        <GlassCard size="lg">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            Journey
          </h2>
          <div className="space-y-5">
            <InfoItem
              label="From"
              value={[trip.journey_locations.travelling_from, trip.journey_locations.postcode_from].filter(Boolean).join(", ")}
            />
            <InfoItem
              label="To"
              value={[trip.journey_locations.travelling_to, trip.journey_locations.postcode_to].filter(Boolean).join(", ")}
            />
            <InfoItem label="Nearest airport" value={trip.journey_locations.nearest_airport} />
          </div>
        </GlassCard>

        {/* Travelers */}
        {trip.people_travelling.length > 0 && (
          <GlassCard size="lg" className={trip.people_travelling.length > 2 ? "sm:col-span-2" : ""}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Travelers
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trip.people_travelling.map((t, i) => (
                <div key={i} className="glass-panel rounded-2xl p-5">
                  <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {t.first_name} {t.last_name}
                  </p>
                  {t.email && <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>{t.email}</p>}
                  {t.phone && <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{t.phone}</p>}
                  {t.dob && <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>DOB: {t.dob}</p>}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Flights */}
        {trip.flights_if_known.length > 0 && (
          <GlassCard size="lg" className="sm:col-span-2">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Flights
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {trip.flights_if_known.map((f, i) => (
                <div key={i} className="glass-panel rounded-2xl p-5">
                  <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {f.airline} {f.flight_number}
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {f.from_airport} → {f.to_airport}
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Departs {f.departure_date} {f.departure_time} · Arrives {f.arrival_date} {f.arrival_time}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Preferences */}
        {(prefLabels.length > 0 || trip.preferences.notes) && (
          <GlassCard size="lg" className="sm:col-span-2">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Preferences
            </h2>
            {prefLabels.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {prefLabels.map((label) => (
                  <span key={label} className="rounded-full border border-blue-400/20 bg-blue-400/8 px-4 py-2 text-sm font-medium text-blue-300">
                    {label}
                  </span>
                ))}
              </div>
            )}
            {trip.preferences.notes && (
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {trip.preferences.notes}
              </p>
            )}
          </GlassCard>
        )}

        {/* Anything else */}
        {trip.anything_else_we_should_know && (
          <GlassCard size="lg" className="sm:col-span-2">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Notes
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {trip.anything_else_we_should_know}
            </p>
          </GlassCard>
        )}
      </section>

      {/* ── Actions ── */}
      <section className="page-enter stagger-5 w-full max-w-5xl mx-auto pb-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <GlassButton variant="teal" size="lg">
          Share Trip
        </GlassButton>
        <GlassButton href="/trip/new" variant="purple" size="lg">
          Plan Another
        </GlassButton>
      </section>
    </PageShell>
  );
}
