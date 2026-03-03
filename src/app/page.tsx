"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";
import OrbField, { LANDING_ORBS, SUBTLE_ORBS } from "@/components/OrbField";
import HeroSection from "@/components/HeroSection";
import PathCard from "@/components/PathCard";
import AuthStatus from "@/components/AuthStatus";
import SearchBar from "@/components/SearchBar";
import TripCard from "@/components/TripCard";
import GlassButton from "@/components/GlassButton";
import GlassCard from "@/components/GlassCard";
import type { TripRow } from "@/types/trip";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/trips")
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            `Server returned non-JSON (${res.status}): ${text.slice(0, 200)}`
          );
        }
        if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
        return data;
      })
      .then((data) => setTrips(data.trips ?? []))
      .catch((err) => {
        console.error("Trips fetch error:", err);
        setError(err.message || "Failed to load trips.");
      })
      .finally(() => setLoading(false));
  }, []);

  const featured = trips[0];
  const standard = trips.slice(1, 5);
  const hasMore = trips.length > 5;

  return (
    <div className="page-shell relative flex min-h-screen flex-col items-center overflow-hidden bg-[var(--background)] px-6 pt-24 pb-16">
      <OrbField orbs={SUBTLE_ORBS} />
      <AuthStatus />

      <main className="relative z-10 w-full max-w-2xl">
        {/* Greeting */}
        <h1 className="page-enter stagger-1 gradient-text text-3xl font-bold sm:text-4xl">
          {getGreeting()} &#9992;&#65039;
        </h1>

        {/* Search Bar */}
        <div className="page-enter stagger-2 mt-6">
          <SearchBar />
        </div>

        {/* Section header */}
        <div className="page-enter stagger-3 mt-10 flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Your Trips
          </h2>
          {hasMore && (
            <Link
              href="/trips"
              className="text-sm font-medium"
              style={{ color: "var(--teal)" }}
            >
              View all &rarr;
            </Link>
          )}
        </div>
        <div className="page-enter stagger-3 prismatic-line w-full mt-2 mb-6" />

        {/* Loading state */}
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
          <GlassCard className="page-enter stagger-4 text-center" elevated>
            <div className="text-5xl mb-4">&#9992;&#65039;</div>
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              No trips yet
            </p>
            <p
              className="mb-8"
              style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}
            >
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
            <div className="page-enter stagger-4">
              <TripCard trip={featured} size="featured" />
            </div>

            {standard.length > 0 && (
              <div className="page-enter stagger-5 grid grid-cols-2 gap-4 mt-4">
                {standard.map((t) => (
                  <TripCard key={t.id} trip={t} size="standard" />
                ))}
              </div>
            )}

            <div className="page-enter stagger-6 mt-8">
              <GlassButton href="/trip/new" variant="teal" className="w-full">
                Plan a New Trip
              </GlassButton>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  const session = useSession();

  if (session.loading) {
    return (
      <div className="page-shell relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 py-20">
        <OrbField orbs={LANDING_ORBS} />
        <div
          className="relative z-10 text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          Loading&hellip;
        </div>
      </div>
    );
  }

  if (session.authenticated) {
    return <Dashboard />;
  }

  return (
    <div className="page-shell relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 py-20">
      <OrbField orbs={LANDING_ORBS} />

      <main className="relative z-10 flex w-full max-w-4xl flex-col items-center">
        <HeroSection />

        {/* Path cards */}
        <div className="page-enter stagger-6 mt-20 grid w-full gap-6 sm:grid-cols-2">
          <PathCard
            href="/auth/entry"
            title="I'm Human"
            description="Plan your trip step by step"
            color="coral"
          />
          <PathCard
            href="/agents/skills"
            title="I'm an Agent"
            description="Integrate with our API"
            color="purple"
          />
        </div>
      </main>
    </div>
  );
}
