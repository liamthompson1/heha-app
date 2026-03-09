"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import PageShell from "@/components/PageShell";
import GlassButton from "@/components/GlassButton";
import ScrollReveal from "@/components/ScrollReveal";
import type { TripRow } from "@/types/trip";
import TripHero from "@/components/trip-detail/TripHero";
import FlightWidget from "@/components/trip-detail/FlightWidget";
import WeatherWidget from "@/components/trip-detail/WeatherWidget";
import TravelersWidget from "@/components/trip-detail/TravelersWidget";
import StoriesWidget from "@/components/trip-detail/StoriesWidget";
import Link from "next/link";
import { formatDateRange } from "@/lib/format-date";

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, loading, mutate: setTrip } = useCachedFetch<TripRow>(
    id ? `/api/trips/${id}` : null,
    { transform: (raw) => (raw as { trip?: TripRow }).trip ?? null }
  );
  const notFound = !loading && !trip;
  const [hasInsurance, setHasInsurance] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Detect insurance availability via trip JSON productTypes
  useEffect(() => {
    if (!trip?.traveller_trip_id) return;
    (async () => {
      try {
        const res = await fetch(`/api/trips/${trip.id}/stories?path=json`);
        if (!res.ok) return;
        const data = await res.json();
        const productTypes = data?.trip?.productTypes;
        if (Array.isArray(productTypes)) {
          const hasIns = productTypes.some(
            (pt: { productType: string }) => pt.productType?.toLowerCase() === "insurance"
          );
          if (hasIns) setHasInsurance(true);
        }
      } catch {
        // Silent fail
      }
    })();
  }, [trip?.traveller_trip_id, trip?.id]);

  const handleImageRegenerated = useCallback((newUrl: string) => {
    if (!trip) return;
    setTrip({ ...trip, image_url: newUrl });
  }, [trip, setTrip]);

  const handleDestinationChange = useCallback(async (name: string) => {
    if (!trip) return;
    const prev = trip;
    const updatedTrip = { ...trip, trip: { ...trip.trip, destination: name } };
    setTrip(updatedTrip);
    try {
      await fetch(`/api/trips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip: updatedTrip.trip }),
      });
    } catch {
      // Revert on failure
      setTrip(prev);
    }
  }, [trip, id, setTrip]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      }
    } catch {
      // Silent fail
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [id, router]);

  if (loading) {
    return (
      <PageShell variant="full">
        <div className="animate-pulse">
          {/* Hero skeleton */}
          <div className="trip-hero">
            <div className="trip-hero-skeleton" />
            <div className="trip-hero-overlay" />
            <div className="trip-hero-content">
              <div className="glass-panel rounded-lg h-4 w-20 mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="glass-panel rounded-xl h-12 w-72 mb-3" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="glass-panel rounded-lg h-4 w-44" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="max-w-5xl mx-auto px-6 pt-12 space-y-12">
            {/* Flights skeleton */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="glass-panel rounded-xl h-6 w-20" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-panel rounded-2xl h-32" />
                <div className="glass-panel rounded-2xl h-32" />
              </div>
            </div>

            {/* Weather skeleton */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="glass-panel rounded-xl h-6 w-24" />
              </div>
              <div className="glass-panel rounded-2xl h-36" />
            </div>

          </div>
        </div>
      </PageShell>
    );
  }

  if (notFound || !trip) {
    return (
      <PageShell backHref="/">
        <div className="flex flex-col items-center justify-center py-32">
          <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Trip Not Found
          </h1>
          <p className="text-lg mb-10" style={{ color: "var(--text-secondary)" }}>
            This trip doesn&rsquo;t exist or may have been removed.
          </p>
          <GlassButton href="/" variant="blue" size="lg">
            Back to My Trips
          </GlassButton>
        </div>
      </PageShell>
    );
  }

  const dateRange = formatDateRange(trip.trip.start_date, trip.trip.end_date);

  return (
    <PageShell variant="full">
      {/* Hero */}
      <TripHero
        destination={trip.trip.destination}
        dateRange={dateRange}
        tripType={trip.trip.trip_type}
        tripId={trip.id}
        imageUrl={trip.image_url}
        isHxTrip={!!trip.traveller_trip_id}
        onDestinationChange={handleDestinationChange}
        onImageRegenerated={handleImageRegenerated}
      />

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-16">
        {/* Flights */}
        <ScrollReveal>
          <FlightWidget
            flights={trip.flights_if_known}
            tripId={trip.id}
            origin={trip.journey_locations?.origin}
          />
        </ScrollReveal>

        {/* Weather */}
        <ScrollReveal delay={100}>
          <WeatherWidget
            destination={trip.trip.destination}
            startDate={trip.trip.start_date}
            endDate={trip.trip.end_date}
            tripId={trip.id}
          />
        </ScrollReveal>

        {/* Insurance */}
        {hasInsurance && (
          <ScrollReveal delay={150}>
            <div className="widget-section">
              <Link href={`/trip/${trip.id}/insurance`} className="missing-info-card">
                <span className="missing-info-icon">🛡️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem", marginBottom: 4 }}>
                    Protect your {trip.trip.destination || "trip"} trip
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    View policies, upload documents &amp; manage your cover
                  </div>
                </div>
                <span className="missing-info-arrow" style={{ color: "var(--text-tertiary)" }}>→</span>
              </Link>
            </div>
          </ScrollReveal>
        )}

        {/* Your Trip — HX Stories */}
        {trip.traveller_trip_id && (
          <ScrollReveal delay={200}>
            <StoriesWidget tripId={trip.id} />
          </ScrollReveal>
        )}

        {/* Travelers */}
        <ScrollReveal delay={300}>
          <TravelersWidget travelers={trip.people_travelling} tripId={trip.id} />
        </ScrollReveal>

        {/* Delete trip + Log out */}
        <ScrollReveal delay={400}>
          <div className="flex justify-center items-center gap-6 pt-8">
            {showDeleteConfirm ? (
              <div className="glass-panel delete-confirm-bar">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Delete this trip permanently?
                </p>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="delete-confirm-btn"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="delete-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="delete-trip-btn"
                >
                  Delete trip
                </button>
                <span style={{ color: "var(--text-tertiary)" }}>·</span>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/";
                  }}
                  className="delete-trip-btn"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </ScrollReveal>
      </div>
    </PageShell>
  );
}
