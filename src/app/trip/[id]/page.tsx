"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import PageShell from "@/components/PageShell";
import GlassButton from "@/components/GlassButton";
import ScrollReveal from "@/components/ScrollReveal";
import type { TripRow } from "@/types/trip";
import type { TripContent } from "@/types/trip-content";
import TripHero from "@/components/trip-detail/TripHero";
import FlightWidget from "@/components/trip-detail/FlightWidget";
import WeatherWidget from "@/components/trip-detail/WeatherWidget";
import ThingsToDoWidget from "@/components/trip-detail/ThingsToDoWidget";
import LocalKnowledgeWidget from "@/components/trip-detail/LocalKnowledgeWidget";
import TravelersWidget from "@/components/trip-detail/TravelersWidget";
import TripOverviewWidget from "@/components/trip-detail/TripOverviewWidget";
import ContentLoadingSkeleton from "@/components/trip-detail/ContentLoadingSkeleton";
import StoriesWidget from "@/components/trip-detail/StoriesWidget";
import { formatDateRange } from "@/lib/format-date";

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, loading, mutate: setTrip } = useCachedFetch<TripRow>(
    id ? `/api/trips/${id}` : null,
    { transform: (raw) => (raw as { trip?: TripRow }).trip ?? null }
  );
  const notFound = !loading && !trip;
  const [content, setContent] = useState<TripContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch or generate AI content
  const fetchContent = useCallback(async (tripData: TripRow) => {
    // Use cached content if available
    if (tripData.trip_content) {
      setContent(tripData.trip_content);
      return;
    }

    if (!tripData.trip.destination) return;

    setContentLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripData.id}/content`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.content) setContent(data.content);
      }
    } catch {
      // Silent fail — content is enhancement, not critical
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (trip) fetchContent(trip);
  }, [trip, fetchContent]);

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

            {/* Things to do skeleton */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="glass-panel rounded-xl h-6 w-32" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-panel rounded-2xl h-40" />
                <div className="glass-panel rounded-2xl h-40" />
                <div className="glass-panel rounded-2xl h-40" />
                <div className="glass-panel rounded-2xl h-40" />
              </div>
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

        {/* HX Stories content */}
        {trip.traveller_trip_id && (
          <ScrollReveal delay={150}>
            <StoriesWidget tripId={trip.id} />
          </ScrollReveal>
        )}

        {/* AI-generated content */}
        {contentLoading ? (
          <ScrollReveal delay={200}>
            <ContentLoadingSkeleton />
          </ScrollReveal>
        ) : content ? (
          <>
            <ScrollReveal delay={200}>
              <ThingsToDoWidget things={content.things_to_do || []} />
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <LocalKnowledgeWidget
                tips={content.local_knowledge || []}
                foodSpots={content.food_and_drink || []}
              />
            </ScrollReveal>

            {content.packing_tips && content.packing_tips.length > 0 && (
              <ScrollReveal delay={350}>
                <div className="widget-section">
                  <div className="widget-header">
                    <span style={{ fontSize: "1.25rem" }}>🧳</span>
                    <h2 className="widget-title">Packing Tips</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: "20px", borderRadius: "var(--glass-radius)" }}>
                    <ul className="space-y-2">
                      {content.packing_tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-xs mt-1" style={{ color: "var(--teal)" }}>✓</span>
                          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            )}
          </>
        ) : null}

        {/* Travelers */}
        <ScrollReveal delay={400}>
          <TravelersWidget travelers={trip.people_travelling} tripId={trip.id} />
        </ScrollReveal>

        {/* Overview + Best Areas */}
        <ScrollReveal delay={500}>
          <TripOverviewWidget trip={trip} bestAreas={content?.best_areas} />
        </ScrollReveal>

        {/* Actions */}
        <ScrollReveal delay={600}>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-8">
            <GlassButton href="/" variant="blue" size="lg">
              Back to My Trips
            </GlassButton>
            <GlassButton href="/trip/new" variant="purple" size="lg">
              Plan Another
            </GlassButton>
          </div>

          {/* Delete trip */}
          <div className="flex justify-center pt-8">
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
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="delete-trip-btn"
              >
                Delete trip
              </button>
            )}
          </div>
        </ScrollReveal>
      </div>
    </PageShell>
  );
}
