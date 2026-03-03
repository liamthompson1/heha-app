"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import type { TripRow } from "@/types/trip";

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

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/trips/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to fetch trip");
        return res.json();
      })
      .then((data) => {
        if (data?.trip) setTrip(data.trip);
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <PageShell backHref="/trips">
        <div className="space-y-6 animate-pulse pt-8">
          <div className="glass-panel rounded-2xl h-16 w-2/3" />
          <div className="glass-panel rounded-2xl h-5 w-1/3" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="glass-panel rounded-2xl h-48" />
            <div className="glass-panel rounded-2xl h-48" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (notFound || !trip) {
    return (
      <PageShell backHref="/trips">
        <div className="flex flex-col items-center justify-center py-32">
          <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Trip Not Found
          </h1>
          <p className="text-lg mb-10" style={{ color: 'var(--text-secondary)' }}>
            This trip doesn&rsquo;t exist or may have been removed.
          </p>
          <GlassButton href="/trips" variant="blue" size="lg">
            Back to My Trips
          </GlassButton>
        </div>
      </PageShell>
    );
  }

  const activities = trip.preferences?.activities ?? [];
  const travelerCount = trip.people_travelling?.length ?? 0;
  const hasFlights = trip.flights_if_known && trip.flights_if_known.length > 0;

  return (
    <PageShell backHref="/trips" variant="full" maxWidth="5xl">
      {/* ── Hero Section ── */}
      <section className="page-enter stagger-1 pt-4 pb-16 sm:pt-8 sm:pb-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
          {trip.trip.trip_type || "Trip"}
        </p>
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-none gradient-text">
          {trip.trip.destination}
        </h1>
        <p className="mt-6 text-lg sm:text-xl" style={{ color: 'var(--text-secondary)' }}>
          {[trip.trip.start_date, trip.trip.end_date]
            .filter(Boolean)
            .join(" – ")}
        </p>
      </section>

      <div className="prismatic-line w-full max-w-5xl mx-auto" />

      {/* ── Info Grid: 2-col on desktop ── */}
      <section className="page-enter stagger-2 w-full max-w-5xl mx-auto py-16 sm:py-24 grid gap-6 sm:gap-8 sm:grid-cols-2">
        {/* Overview */}
        <GlassCard size="lg">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            Overview
          </h2>
          <div className="space-y-5">
            <InfoItem label="Destination" value={trip.trip.destination} />
            <InfoItem label="Trip type" value={trip.trip.trip_type ?? ""} />
            <InfoItem label="Budget" value={trip.preferences?.budget ?? ""} />
            <InfoItem label="Accommodation" value={trip.preferences?.accommodation_type ?? ""} />
            <InfoItem label="Pace" value={trip.preferences?.pace ?? ""} />
          </div>
        </GlassCard>

        {/* Journey */}
        {trip.journey_locations && (
          <GlassCard size="lg">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Journey
            </h2>
            <div className="space-y-5">
              <InfoItem label="Origin" value={trip.journey_locations.origin ?? ""} />
              {trip.journey_locations.stops &&
                trip.journey_locations.stops.length > 0 && (
                  <InfoItem
                    label="Route"
                    value={trip.journey_locations.stops.join(" → ")}
                  />
                )}
            </div>
          </GlassCard>
        )}

        {/* Travelers — spans full width if many */}
        {travelerCount > 0 && (
          <GlassCard size="lg" className={travelerCount > 2 ? "sm:col-span-2" : ""}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Travelers
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trip.people_travelling.map((p, i) => (
                <div key={i} className="glass-panel rounded-2xl p-5">
                  <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  {p.age != null && (
                    <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Age {p.age}</p>
                  )}
                  {p.dietary_requirements && p.dietary_requirements.length > 0 && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {p.dietary_requirements.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Flights — full width */}
        {hasFlights && (
          <GlassCard size="lg" className="sm:col-span-2">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Flights
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {trip.flights_if_known!.map((f, i) => (
                <div key={i} className="glass-panel rounded-2xl p-5">
                  {(f.airline || f.flight_number) && (
                    <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {[f.airline, f.flight_number].filter(Boolean).join(" ")}
                    </p>
                  )}
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {f.departure_airport} → {f.arrival_airport}
                  </p>
                  {(f.departure_time || f.arrival_time) && (
                    <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                      {f.departure_time && `Departs ${f.departure_time}`}
                      {f.departure_time && f.arrival_time && " · "}
                      {f.arrival_time && `Arrives ${f.arrival_time}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Activities */}
        {activities.length > 0 && (
          <GlassCard size="lg" className={activities.length > 4 ? "sm:col-span-2" : ""}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Activities
            </h2>
            <div className="flex flex-wrap gap-3">
              {activities.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-blue-400/20 bg-blue-400/8 px-4 py-2 text-sm font-medium text-blue-300"
                >
                  {a}
                </span>
              ))}
            </div>
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
        <GlassButton href="/trips" variant="blue" size="lg">
          Back to My Trips
        </GlassButton>
        <GlassButton href="/trip/new" variant="purple" size="lg">
          Plan Another
        </GlassButton>
      </section>
    </PageShell>
  );
}
