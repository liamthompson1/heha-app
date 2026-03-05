"use client";

import type { FlightCardData } from "@/types/agent";

interface FlightConfirmationProps {
  card: FlightCardData;
  direction: "outbound" | "return";
}

export default function FlightConfirmation({ card, direction }: FlightConfirmationProps) {
  return (
    <div className="flight-confirmation-card">
      <div className="flight-confirmation-header">
        <img
          src={`https://airlabs.co/img/airline/m/${card.airline_code}.png`}
          className="flight-card-logo"
          width={24}
          height={24}
          loading="lazy"
          alt=""
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="flight-confirmation-airline">{card.airline} {card.flight_number}</span>
      </div>
      <div className="flight-confirmation-times">
        <span>{card.departure_time} {card.from}</span>
        <span className="flight-confirmation-arrow">→</span>
        <span>{card.arrival_time} {card.to}</span>
        <span className="flight-confirmation-duration">{card.duration}</span>
      </div>
      <div className="flight-confirmation-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        {direction === "outbound" ? "Outbound" : "Return"} flight confirmed
      </div>
    </div>
  );
}
