"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import type { TripRow } from "@/types/trip";

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <span className="text-white/40">{label}: </span>
      <span className="text-white/75">{value}</span>
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
        <div className="text-white/40 text-sm text-center py-12">
          Loading trip…
        </div>
      </PageShell>
    );
  }

  if (notFound || !trip) {
    return (
      <PageShell backHref="/trips">
        <GlassCard className="text-center">
          <h1 className="text-2xl font-bold text-white/90 mb-3">
            Trip Not Found
          </h1>
          <p className="text-white/50 mb-6">
            This trip doesn&rsquo;t exist or may have been removed.
          </p>
          <GlassButton href="/trips" variant="blue">
            Back to My Trips
          </GlassButton>
        </GlassCard>
      </PageShell>
    );
  }

  const activities = trip.preferences?.activities ?? [];
  const travelerCount = trip.people_travelling?.length ?? 0;

  return (
    <PageShell backHref="/trips">
      {/* Header */}
      <div className="page-enter stagger-1 mb-2">
        <h1 className="gradient-text text-4xl font-bold sm:text-5xl">
          {trip.trip.destination}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {[trip.trip.start_date, trip.trip.end_date]
            .filter(Boolean)
            .join(" – ")}
          {trip.trip.trip_type && ` · ${trip.trip.trip_type}`}
        </p>
      </div>

      <div className="page-enter stagger-2 prismatic-line w-full mb-8" />

      {/* Overview */}
      <GlassCard className="page-enter stagger-2 mb-5">
        <h2 className="text-lg font-semibold text-white/90 mb-3">Overview</h2>
        <div className="space-y-1">
          <InfoRow label="Destination" value={trip.trip.destination} />
          <InfoRow label="Trip type" value={trip.trip.trip_type ?? ""} />
          <InfoRow label="Budget" value={trip.preferences?.budget ?? ""} />
          <InfoRow
            label="Accommodation"
            value={trip.preferences?.accommodation_type ?? ""}
          />
          <InfoRow label="Pace" value={trip.preferences?.pace ?? ""} />
        </div>
      </GlassCard>

      {/* Travelers */}
      {travelerCount > 0 && (
        <GlassCard className="page-enter stagger-3 mb-5">
          <h2 className="text-lg font-semibold text-white/90 mb-3">
            Travelers
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {trip.people_travelling.map((p, i) => (
              <div key={i} className="glass-panel rounded-xl p-4">
                <p className="font-medium text-white/90">{p.name}</p>
                {p.age != null && (
                  <p className="text-xs text-white/40 mt-1">Age: {p.age}</p>
                )}
                {p.dietary_requirements && p.dietary_requirements.length > 0 && (
                  <p className="text-xs text-white/30 mt-1">
                    Diet: {p.dietary_requirements.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Journey */}
      {trip.journey_locations && (
        <GlassCard className="page-enter stagger-3 mb-5">
          <h2 className="text-lg font-semibold text-white/90 mb-3">Journey</h2>
          <div className="space-y-1">
            <InfoRow label="Origin" value={trip.journey_locations.origin ?? ""} />
            {trip.journey_locations.stops &&
              trip.journey_locations.stops.length > 0 && (
                <InfoRow
                  label="Stops"
                  value={trip.journey_locations.stops.join(" → ")}
                />
              )}
          </div>
        </GlassCard>
      )}

      {/* Flights */}
      {trip.flights_if_known && trip.flights_if_known.length > 0 && (
        <GlassCard className="page-enter stagger-4 mb-5">
          <h2 className="text-lg font-semibold text-white/90 mb-3">Flights</h2>
          <div className="space-y-3">
            {trip.flights_if_known.map((f, i) => (
              <div key={i} className="glass-panel rounded-xl p-4">
                {(f.airline || f.flight_number) && (
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-medium text-white/90">
                      {[f.airline, f.flight_number].filter(Boolean).join(" ")}
                    </span>
                  </div>
                )}
                <p className="text-sm text-white/60">
                  {f.departure_airport} → {f.arrival_airport}
                </p>
                {(f.departure_time || f.arrival_time) && (
                  <p className="text-xs text-white/40 mt-1">
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
        <GlassCard className="page-enter stagger-4 mb-5">
          <h2 className="text-lg font-semibold text-white/90 mb-3">
            Activities
          </h2>
          <div className="flex flex-wrap gap-2">
            {activities.map((a) => (
              <span
                key={a}
                className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs text-blue-300"
              >
                {a}
              </span>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Anything else */}
      {trip.anything_else_we_should_know && (
        <GlassCard className="page-enter stagger-5 mb-5">
          <h2 className="text-lg font-semibold text-white/90 mb-3">
            Anything Else
          </h2>
          <p className="text-sm text-white/60">
            {trip.anything_else_we_should_know}
          </p>
        </GlassCard>
      )}

      {/* Actions */}
      <div className="page-enter stagger-5 mt-8 flex flex-col gap-3 sm:flex-row">
        <GlassButton href="/trips" variant="blue" className="flex-1">
          Back to My Trips
        </GlassButton>
        <GlassButton href="/trip/new" variant="purple" className="flex-1">
          Plan Another
        </GlassButton>
      </div>
    </PageShell>
  );
}
