"use client";

import { useParams } from "next/navigation";
import PageShell from "@/components/PageShell";

import {
  MOCK_FLIGHT,
  MOCK_ON_TIME,
  MOCK_WEATHER,
  MOCK_GATE_INFO,
  MOCK_AIRCRAFT,
  MOCK_INBOUND,
  MOCK_TIMELINE,
  MOCK_WIFI,
  MOCK_AMENITIES,
  MOCK_SECURITY_QUEUE,
  MOCK_RESTAURANTS,
} from "@/services/mock/briefing-mock-data";

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

export default function BriefingPage() {
  const { id } = useParams<{ id: string }>();

  // TODO: Use `id` to fetch real flight data from services
  // For now, render mock data for any trip ID
  const flight = MOCK_FLIGHT;

  return (
    <PageShell backHref={`/trip/${id}`}>
      <TripHero flight={flight} />

      <div className="flex flex-col gap-4">
        {/* 1. Timeline */}
        <TimelineCard steps={MOCK_TIMELINE} delay={0.15} />

        {/* 2. Weather */}
        <WeatherCard weather={MOCK_WEATHER} delay={0.3} />

        {/* 3. Gate & Arrival */}
        <GateInfoCard gateInfo={MOCK_GATE_INFO} delay={0.45} />

        {/* 4. Arrival Forecast */}
        <OnTimeCard stats={MOCK_ON_TIME} delay={0.6} />

        {/* 5. Inbound Aircraft */}
        <InboundCard inbound={MOCK_INBOUND} delay={0.75} />

        {/* 6. Aircraft Details */}
        <AircraftCard aircraft={MOCK_AIRCRAFT} delay={0.9} />

        {/* 7. Security Queue */}
        <SecurityCard queue={MOCK_SECURITY_QUEUE} delay={1.05} />

        {/* 8. Airport Wi-Fi */}
        <WifiCard wifi={MOCK_WIFI} delay={1.2} />

        {/* 9. IFE & Power */}
        <AmenitiesCard amenities={MOCK_AMENITIES} delay={1.35} />

        {/* 10. Restaurants */}
        <RestaurantsCard data={MOCK_RESTAURANTS} delay={1.5} />
      </div>
    </PageShell>
  );
}
