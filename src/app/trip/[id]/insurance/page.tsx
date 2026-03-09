"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import PageShell from "@/components/PageShell";
import GlassButton from "@/components/GlassButton";
import InsuranceHub from "@/components/insurance/InsuranceHub";
import InsuranceBanner from "@/components/insurance/InsuranceBanner";
import type { TripRow } from "@/types/trip";
import { parseStoriesHtml, INSURANCE_KEYWORDS } from "@/lib/stories-parser";
import { parseInsuranceHtml } from "@/lib/insurance-parser";
import type { ParsedInsuranceData } from "@/lib/insurance-parser";

export default function InsurancePage() {
  const { id } = useParams<{ id: string }>();
  const { data: trip, loading } = useCachedFetch<TripRow>(
    id ? `/api/trips/${id}` : null,
    { transform: (raw) => (raw as { trip?: TripRow }).trip ?? null }
  );
  const notFound = !loading && !trip;
  const [insuranceData, setInsuranceData] = useState<ParsedInsuranceData | null>(null);

  // Fetch stories and parse insurance section
  useEffect(() => {
    if (!trip?.traveller_trip_id) return;

    (async () => {
      try {
        const res = await fetch(`/api/trips/${trip.id}/stories`);
        if (!res.ok) return;
        const json = await res.json();
        if (!json.text) return;

        const sections = parseStoriesHtml(json.text);
        const match = sections.find((s) => INSURANCE_KEYWORDS.test(s.title));
        if (match) {
          setInsuranceData(parseInsuranceHtml(match.html));
        }
      } catch {
        // Silent fail — insurance data is an enhancement
      }
    })();
  }, [trip?.traveller_trip_id, trip?.id]);

  if (loading) {
    return (
      <PageShell backHref={`/trip/${id}`}>
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="glass-panel rounded-xl h-8 w-64" />
            </div>
            <div className="glass-panel rounded-2xl h-40 mb-6" />
            <div className="glass-panel rounded-2xl h-32 mb-6" />
            <div className="glass-panel rounded-2xl h-24" />
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

  return (
    <PageShell backHref={`/trip/${id}`} variant="full">
      <InsuranceBanner
        destination={trip.trip.destination}
        startDate={trip.trip.start_date}
        endDate={trip.trip.end_date}
      />
      <InsuranceHub trip={trip} insuranceData={insuranceData} />
    </PageShell>
  );
}
