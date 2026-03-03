"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";
import OrbField, { LANDING_ORBS, SUBTLE_ORBS } from "@/components/OrbField";
import HeroSection from "@/components/HeroSection";
import PathCard from "@/components/PathCard";
import AuthStatus from "@/components/AuthStatus";
import SearchBar from "@/components/SearchBar";
import LogoHeader from "@/components/LogoHeader";
import BentoTripGrid from "@/components/BentoTripGrid";
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

  return (
    <div className="page-shell relative flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--background)] px-4 sm:px-6 pt-20 pb-28">
      <OrbField orbs={SUBTLE_ORBS} />
      <LogoHeader />
      <AuthStatus />

      <main className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col">
        {/* Greeting */}
        <h1 className="page-enter stagger-1 text-4xl font-bold sm:text-5xl lg:text-6xl tracking-tight" style={{ color: "var(--foreground)" }}>
          {getGreeting()}
        </h1>

        {/* Section header */}
        <div className="page-enter stagger-2 mt-16 flex items-end justify-between">
          <h2
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--text-secondary)" }}
          >
            Your Trips
          </h2>
          {trips.length > 0 && (
            <Link
              href="/trips"
              className="text-sm font-medium"
              style={{ color: "var(--teal)" }}
            >
              View all &rarr;
            </Link>
          )}
        </div>
        <div className="page-enter stagger-3 prismatic-line w-full mt-4 mb-12" />

        {/* Loading state */}
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

export default function Home() {
  const session = useSession();

  if (session.loading) {
    return (
      <div className="page-shell relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 py-20">
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
    <div className="page-shell relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 py-20">
      <OrbField orbs={LANDING_ORBS} />

      <main className="relative z-10 flex w-full max-w-5xl flex-col items-center px-6">
        <HeroSection />

        {/* Path cards */}
        <div className="page-enter stagger-6 mt-28 sm:mt-36 grid w-full gap-8 sm:grid-cols-2">
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
