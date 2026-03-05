import { notFound } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { assembleBriefing } from "@/services/briefing/briefing-assembler";
import type { TripRow } from "@/types/trip";

import PageShell from "@/components/PageShell";
import { TripHero } from "@/components/trip/briefing/trip-hero";
import { TimelineCard } from "@/components/trip/briefing/timeline-card";
import { WeatherCard } from "@/components/trip/briefing/weather-card";
import { GateInfoCard } from "@/components/trip/briefing/gate-info-card";
import { OnTimeCard } from "@/components/trip/briefing/on-time-card";
import { InboundCard } from "@/components/trip/briefing/inbound-card";
import { AircraftCard } from "@/components/trip/briefing/aircraft-card";
import { SecurityCard } from "@/components/trip/briefing/security-card";
import { WifiCard } from "@/components/trip/briefing/wifi-card";
import { AmenitiesCard } from "@/components/trip/briefing/amenities-card";
import { RestaurantsCard } from "@/components/trip/briefing/restaurants-card";
import { DestinationCard } from "@/components/trip/briefing/destination-card";
import { SectionCard } from "@/components/trip/briefing/section-card";

function PlaceholderCard({ title, delay }: { title: string; delay?: number }) {
  return (
    <SectionCard title={title} accentColor="var(--blue)" delay={delay}>
      <div className="flex items-center gap-3 py-4">
        <div className="h-4 w-4 rounded-full bg-white/10 animate-pulse" />
        <p className="text-sm text-white/30">Data not yet available</p>
      </div>
    </SectionCard>
  );
}

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch trip from Supabase
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const trip = data as TripRow;
  const briefing = await assembleBriefing(trip);

  // No flight data at all — friendly empty state
  if (!briefing) {
    return (
      <PageShell backHref={`/trip/${id}`}>
        <div className="text-center py-16">
          <p className="text-2xl font-bold text-white/80 mb-2">No flights yet</p>
          <p className="text-sm text-white/40">
            Add flight details to your trip to see your briefing.
          </p>
        </div>
      </PageShell>
    );
  }

  const hasFlight = !!briefing.flight;

  return (
    <PageShell backHref={`/trip/${id}`}>
      {briefing.flight && <TripHero flight={briefing.flight} />}

      <div className="flex flex-col gap-4">
        {/* 0. Destination */}
        {briefing.destination && (
          <DestinationCard destination={briefing.destination} delay={0.1} />
        )}

        {/* Flight-dependent cards — only show when flight data exists */}
        {hasFlight && (
          <>
            {/* 1. Timeline */}
            {briefing.timeline.length > 0 && (
              <TimelineCard steps={briefing.timeline} delay={0.2} />
            )}

            {/* 2. Weather */}
            {briefing.weather ? (
              <WeatherCard weather={briefing.weather} delay={0.3} />
            ) : (
              <PlaceholderCard title="Weather" delay={0.3} />
            )}

            {/* 3. Gate & Arrival */}
            {briefing.gateInfo ? (
              <GateInfoCard gateInfo={briefing.gateInfo} delay={0.45} />
            ) : (
              <PlaceholderCard title="Gate & Arrival" delay={0.45} />
            )}

            {/* 4. Arrival Forecast */}
            {briefing.onTime ? (
              <OnTimeCard stats={briefing.onTime} delay={0.6} />
            ) : (
              <PlaceholderCard title="On-Time Performance" delay={0.6} />
            )}

            {/* 5. Inbound Aircraft */}
            {briefing.inbound ? (
              <InboundCard inbound={briefing.inbound} delay={0.75} />
            ) : (
              <PlaceholderCard title="Inbound Aircraft" delay={0.75} />
            )}

            {/* 6. Aircraft Details */}
            {briefing.aircraft ? (
              <AircraftCard aircraft={briefing.aircraft} delay={0.9} />
            ) : (
              <PlaceholderCard title="Aircraft Details" delay={0.9} />
            )}

            {/* 7. Security Queue */}
            {briefing.security ? (
              <SecurityCard queue={briefing.security} delay={1.05} />
            ) : (
              <PlaceholderCard title="Security Queue" delay={1.05} />
            )}

            {/* 8. Airport Wi-Fi */}
            {briefing.wifi ? (
              <WifiCard wifi={briefing.wifi} delay={1.2} />
            ) : (
              <PlaceholderCard title="Airport Wi-Fi" delay={1.2} />
            )}

            {/* 9. IFE & Power */}
            {briefing.amenities ? (
              <AmenitiesCard amenities={briefing.amenities} delay={1.35} />
            ) : (
              <PlaceholderCard title="IFE & Power" delay={1.35} />
            )}

            {/* 10. Restaurants */}
            {briefing.restaurants ? (
              <RestaurantsCard data={briefing.restaurants} delay={1.5} />
            ) : (
              <PlaceholderCard title="Restaurants" delay={1.5} />
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
