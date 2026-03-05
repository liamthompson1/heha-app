"use client";

import type { FlightCardData } from "@/types/agent";

interface FlightCardProps {
  card: FlightCardData;
  selected?: boolean;
  onSelect: (card: FlightCardData) => void;
}

function FlightCard({ card, selected, onSelect }: FlightCardProps) {
  return (
    <button
      type="button"
      className={`flight-card${selected ? " flight-card-selected" : ""}`}
      onClick={() => onSelect(card)}
    >
      <div className="flight-card-header">
        <span className="flight-card-airline">{card.airline}</span>
        <span className="flight-card-number">{card.flight_number}</span>
      </div>
      <div className="flight-card-route">
        <div className="flight-card-endpoint">
          <span className="flight-card-time">{card.departure_time}</span>
          <span className="flight-card-iata">{card.from}</span>
        </div>
        <div className="flight-card-connector">
          <span className="flight-card-duration">{card.duration}</span>
          <div className="flight-card-line">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="flight-card-plane">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
        </div>
        <div className="flight-card-endpoint">
          <span className="flight-card-time">{card.arrival_time}</span>
          <span className="flight-card-iata">{card.to}</span>
        </div>
      </div>
      <div className="flight-card-footer">
        <span className="flight-card-date">{card.departure_date}</span>
        {selected && <span className="flight-card-badge">Selected</span>}
      </div>
    </button>
  );
}

interface FlightCardListProps {
  cards: FlightCardData[];
  selectedRef?: string;
  onSelect: (card: FlightCardData) => void;
}

export default function FlightCardList({ cards, selectedRef, onSelect }: FlightCardListProps) {
  return (
    <div className="flight-cards-container">
      {cards.map((card) => (
        <FlightCard
          key={card.flight_reference}
          card={card}
          selected={card.flight_reference === selectedRef}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
