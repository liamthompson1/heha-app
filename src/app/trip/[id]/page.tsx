"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [content, setContent] = useState<TripContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch trip data
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
      <PageShell>
        <div className="space-y-6 animate-pulse pt-8">
          <div className="glass-panel rounded-2xl h-[45vh] w-full" />
          <div className="max-w-5xl mx-auto px-6 space-y-6 pt-8">
            <div className="glass-panel rounded-2xl h-48" />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="glass-panel rounded-2xl h-48" />
              <div className="glass-panel rounded-2xl h-48" />
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

  const dateRange = [trip.trip.start_date, trip.trip.end_date]
    .filter(Boolean)
    .join(" – ");

  return (
    <PageShell variant="full">
      {/* Hero */}
      <TripHero
        destination={trip.trip.destination}
        dateRange={dateRange}
        tripType={trip.trip.trip_type}
        tripId={trip.id}
        imageUrl={trip.image_url}
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
