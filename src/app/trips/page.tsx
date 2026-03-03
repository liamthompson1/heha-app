"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import PageShell from "@/components/PageShell";
import SearchBar from "@/components/SearchBar";
import TripCard from "@/components/TripCard";
import GlassButton from "@/components/GlassButton";
import GlassCard from "@/components/GlassCard";
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
        <div className="text-white/40 text-sm text-center">Loading&hellip;</div>
      </PageShell>
    );
  }

  const featured = trips[0];
  const rest = trips.slice(1);

  return (
    <>
    <PageShell backHref="/">
      {/* Header */}
      <div className="page-enter stagger-1 mb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="gradient-text text-4xl font-bold sm:text-5xl">
            Your Trips
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {!loading && trips.length > 0
              ? `${trips.length} trip${trips.length !== 1 ? "s" : ""} planned`
              : "Your saved trip plans"}
          </p>
        </div>
        <GlassButton href="/trip/new" variant="teal" size="sm">
          + New Trip
        </GlassButton>
      </div>

      <div className="page-enter stagger-2 prismatic-line w-full mb-6" />

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          <div className="trip-card trip-card-featured">
            <div className="trip-card-skeleton" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="trip-card trip-card-standard">
              <div className="trip-card-skeleton" />
            </div>
            <div className="trip-card trip-card-standard">
              <div className="trip-card-skeleton" />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-red-400 text-sm text-center py-12">{error}</div>
      )}

      {/* Empty state */}
      {!loading && !error && trips.length === 0 && (
        <GlassCard className="page-enter stagger-3 text-center" elevated>
          <div className="text-5xl mb-4">&#9992;&#65039;</div>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No trips yet
          </p>
          <p className="mb-8" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Start planning your next adventure — it only takes a minute.
          </p>
          <GlassButton href="/trip/new" variant="teal" size="lg">
            Plan Your First Trip
          </GlassButton>
        </GlassCard>
      )}

      {/* Bento grid */}
      {!loading && !error && trips.length > 0 && (
        <>
          <div className="page-enter stagger-3">
            <TripCard trip={featured} size="featured" />
          </div>

          {rest.length > 0 && (
            <div className="page-enter stagger-4 grid grid-cols-2 gap-4 mt-4">
              {rest.map((t) => (
                <TripCard key={t.id} trip={t} size="standard" />
              ))}
            </div>
          )}

          <div className="page-enter stagger-5 mt-8 pb-28">
            <GlassButton href="/trip/new" variant="teal" className="w-full">
              Plan a New Trip
            </GlassButton>
          </div>
        </>
      )}
    </PageShell>
    <SearchBar />
    </>
  );
}
