"use client";

import type { ApiFlight } from "@/types/trip";
import MissingInfoCard from "./MissingInfoCard";

interface FlightWidgetProps {
  flights?: ApiFlight[];
  tripId: string;
  origin?: string;
}

function FlightDetailCard({ flight, direction }: { flight: ApiFlight; direction: string }) {
  return (
    <div className="flight-detail-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          {direction}
        </span>
        {(flight.airline || flight.flight_number) && (
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {[flight.airline, flight.flight_number].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>

      <div className="flight-route">
        <div className="flight-route-endpoint">
          <span className="flight-airport-code">{flight.departure_airport}</span>
          <span className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            {flight.departure_time || "\u00A0"}
          </span>
        </div>

        <div className="flight-route-line">
          <div className="flight-route-track" />
          <span className="flight-route-plane">✈</span>
        </div>

        <div className="flight-route-endpoint" style={{ textAlign: "right" }}>
          <span className="flight-airport-code">{flight.arrival_airport}</span>
          <span className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            {flight.arrival_time || "\u00A0"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FlightWidget({ flights, tripId, origin }: FlightWidgetProps) {
  const hasFlights = flights && flights.length > 0;

  // Determine outbound vs return
  let outbound: ApiFlight | undefined;
  let returnFlight: ApiFlight | undefined;

  if (hasFlights) {
    // Try to match by origin airport, else just use order
    outbound = flights.find(
      (f) => origin && f.departure_airport.toLowerCase() === origin.toLowerCase()
    ) || flights[0];

    returnFlight = flights.find((f) => f !== outbound);
  }

  return (
    <div className="widget-section">
      <div className="widget-header">
        <span style={{ fontSize: "1.25rem" }}>✈️</span>
        <h2 className="widget-title">Flights</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {outbound ? (
          <FlightDetailCard flight={outbound} direction="Outbound" />
        ) : (
          <MissingInfoCard
            tripId={tripId}
            field="flights"
            icon="🛫"
            title="Add your outbound flight"
            description="Flight details help us plan your trip better"
            variant="blue"
          />
        )}

        {returnFlight ? (
          <FlightDetailCard flight={returnFlight} direction="Return" />
        ) : (
          <MissingInfoCard
            tripId={tripId}
            field="flights"
            icon="🛬"
            title="Add your return flight"
            description="So we know when you're heading home"
            variant="blue"
          />
        )}
      </div>
    </div>
  );
}
