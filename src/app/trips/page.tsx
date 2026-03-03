"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";
import PageShell from "@/components/PageShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import type { TripRow } from "@/types/trip";

export default function TripsPage() {
  const session = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session.loading && !session.authenticated) {
      router.replace("/auth/entry");
    }
  }, [session.loading, session.authenticated, router]);

  useEffect(() => {
    if (!session.authenticated) return;

    fetch("/api/trips")
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Server returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
        }
        if (!res.ok) {
          throw new Error(data.error || `API error ${res.status}`);
        }
        return data;
      })
      .then((data) => {
        setTrips(data.trips ?? []);
      })
      .catch((err) => {
        console.error("Trips fetch error:", err);
        setError(err.message || "Failed to load trips.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session.authenticated]);

  if (session.loading || !session.authenticated) {
    return (
      <PageShell backHref="/">
        <div className="text-white/40 text-sm text-center">Loading…</div>
      </PageShell>
    );
  }

  return (
    <PageShell backHref="/">
      <div className="page-enter stagger-1 mb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="gradient-text text-4xl font-bold sm:text-5xl">
            My Trips
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Your saved trip plans
          </p>
        </div>
        <GlassButton href="/trip/new" variant="teal" size="sm">
          + New Trip
        </GlassButton>
      </div>

      <div className="page-enter stagger-2 prismatic-line w-full mb-8" />

      {loading && (
        <div className="text-white/40 text-sm text-center py-12">
          Loading trips…
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm text-center py-12">{error}</div>
      )}

      {!loading && !error && trips.length === 0 && (
        <GlassCard className="page-enter stagger-3 text-center">
          <p className="text-white/50 mb-6">
            You haven&rsquo;t planned any trips yet.
          </p>
          <GlassButton href="/trip/new" variant="teal">
            Plan Your First Trip
          </GlassButton>
        </GlassCard>
      )}

      {!loading && !error && trips.length > 0 && (
        <>
          <div className="space-y-4">
            {trips.map((trip, i) => (
              <Link key={trip.id} href={`/trip/${trip.id}`}>
                <GlassCard
                  className={`page-enter stagger-${Math.min(i + 3, 6)} cursor-pointer transition-all hover:scale-[1.01]`}
                  size="sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-white/90 truncate">
                        {trip.trip.destination}
                      </h2>
                      <p className="text-sm text-white/50 mt-1">
                        {[trip.trip.start_date, trip.trip.end_date]
                          .filter(Boolean)
                          .join(" – ")}
                        {trip.trip.trip_type && ` · ${trip.trip.trip_type}`}
                      </p>
                      {trip.people_travelling.length > 0 && (
                        <p className="text-xs text-white/30 mt-1">
                          {trip.people_travelling.length}{" "}
                          {trip.people_travelling.length === 1
                            ? "traveler"
                            : "travelers"}
                        </p>
                      )}
                    </div>
                    <span className="text-white/20 text-sm shrink-0">→</span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>

          <div className="page-enter stagger-5 mt-8">
            <GlassButton href="/trip/new" variant="teal" className="w-full">
              Plan a New Trip
            </GlassButton>
          </div>
        </>
      )}
    </PageShell>
  );
}
