"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import OrbField, { SUBTLE_ORBS } from "@/components/OrbField";
import LogoHeader from "@/components/LogoHeader";
import BackLink from "@/components/BackLink";
import AuthStatus from "@/components/AuthStatus";
import SearchBar from "@/components/SearchBar";
import BentoTripGrid from "@/components/BentoTripGrid";
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
      <div className="page-shell relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-4 sm:px-6">
        <OrbField orbs={SUBTLE_ORBS} />
        <LogoHeader />
        <div className="relative z-10 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Loading&hellip;
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell relative flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--background)] px-4 sm:px-6 pt-20 pb-28">
      <OrbField orbs={SUBTLE_ORBS} />
      <LogoHeader />
      <BackLink href="/" />
      <AuthStatus />

      <main className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="page-enter stagger-1 mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
              {!loading && trips.length > 0
                ? `${trips.length} trip${trips.length !== 1 ? "s" : ""} planned`
                : "Your saved trip plans"}
            </p>
            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl tracking-tight" style={{ color: "var(--foreground)" }}>
              Your Trips
            </h1>
          </div>
          <GlassButton href="/trip/new" variant="teal">
            + New Trip
          </GlassButton>
        </div>

        <div className="page-enter stagger-2 prismatic-line w-full mt-4 mb-12" />

        {/* Loading skeletons */}
        {loading && (
          <div className="bento-trip-grid">
            <div className="trip-card trip-card-hero">
              <div className="trip-card-skeleton" />
            </div>
            <div className="trip-card trip-card-standard">
              <div className="trip-card-skeleton" />
            </div>
            <div className="trip-card trip-card-standard">
              <div className="trip-card-skeleton" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm text-center py-12">{error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && trips.length === 0 && (
          <div className="max-w-lg mx-auto">
            <GlassCard className="page-enter stagger-3 text-center" elevated>
              <div className="text-5xl mb-4">&#9992;&#65039;</div>
              <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                No trips yet
              </p>
              <p className="mb-8" style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                Start planning your next adventure — it only takes a minute.
              </p>
              <GlassButton href="/trip/new" variant="teal" size="lg">
                Plan Your First Trip
              </GlassButton>
            </GlassCard>
          </div>
        )}

        {/* Bento grid */}
        {!loading && !error && trips.length > 0 && (
          <BentoTripGrid trips={trips} />
        )}
      </main>

      <SearchBar />
    </div>
  );
}
