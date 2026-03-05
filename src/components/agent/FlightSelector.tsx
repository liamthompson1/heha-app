"use client";

import { useState, useMemo } from "react";
import type { FlightCardData } from "@/types/agent";
import FlightCard from "./FlightCard";
import GlassButton from "@/components/GlassButton";

type TimeFilter = "morning" | "afternoon" | "evening" | null;

interface FlightSelectorProps {
  phase: "outbound" | "return";
  flights: FlightCardData[];
  routeLabel: string;
  onConfirm: (card: FlightCardData) => void;
  onSkip: () => void;
}

export default function FlightSelector({
  phase,
  flights,
  routeLabel,
  onConfirm,
  onSkip,
}: FlightSelectorProps) {
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);

  const filtered = useMemo(() => {
    return flights.filter((f) => {
      const q = filterText.toLowerCase();
      const matchesText =
        !q ||
        f.airline.toLowerCase().includes(q) ||
        f.flight_number.toLowerCase().includes(q);
      const hour = parseInt(f.departure_time.split(":")[0], 10);
      const matchesTime =
        !timeFilter ||
        (timeFilter === "morning" && hour < 12) ||
        (timeFilter === "afternoon" && hour >= 12 && hour < 18) ||
        (timeFilter === "evening" && hour >= 18);
      return matchesText && matchesTime;
    });
  }, [flights, filterText, timeFilter]);

  const selectedCard = flights.find((f) => f.flight_reference === selectedRef);

  const handleSelect = (card: FlightCardData) => {
    setSelectedRef(
      card.flight_reference === selectedRef ? null : card.flight_reference
    );
  };

  const toggleTime = (t: TimeFilter) => {
    setTimeFilter(timeFilter === t ? null : t);
  };

  return (
    <div className="flight-selector-inline">
      {/* Header */}
      <div className="flight-selector-header">
        <span className="flight-selector-direction">
          {phase === "outbound" ? "OUTBOUND FLIGHT" : "RETURN FLIGHT"}
        </span>
        <span className="flight-selector-route">{routeLabel}</span>
      </div>

      {/* Filters */}
      <div className="flight-selector-filters">
        <input
          type="text"
          className="flight-selector-search glass-input"
          placeholder="Search airline or flight number..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <div className="flight-time-chips">
          <button
            type="button"
            className={`flight-time-chip${timeFilter === "morning" ? " flight-time-chip-active" : ""}`}
            onClick={() => toggleTime("morning")}
          >
            Morning
          </button>
          <button
            type="button"
            className={`flight-time-chip${timeFilter === "afternoon" ? " flight-time-chip-active" : ""}`}
            onClick={() => toggleTime("afternoon")}
          >
            Afternoon
          </button>
          <button
            type="button"
            className={`flight-time-chip${timeFilter === "evening" ? " flight-time-chip-active" : ""}`}
            onClick={() => toggleTime("evening")}
          >
            Evening
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="flight-selector-count">
        Showing {filtered.length} of {flights.length} flights
      </div>

      {/* Grid */}
      <div className="flight-selector-grid">
        {filtered.map((card) => (
          <FlightCard
            key={card.flight_reference}
            card={card}
            selected={card.flight_reference === selectedRef}
            onSelect={handleSelect}
          />
        ))}
        {filtered.length === 0 && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", padding: "16px", gridColumn: "1 / -1", textAlign: "center" }}>
            No flights match your filters
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flight-selector-actions">
        <button
          type="button"
          className="flight-selector-skip"
          onClick={onSkip}
        >
          Skip flights
        </button>
        <GlassButton
          variant="teal"
          disabled={!selectedCard}
          onClick={() => selectedCard && onConfirm(selectedCard)}
        >
          {selectedCard
            ? `Confirm ${selectedCard.airline} ${selectedCard.flight_number}`
            : "Select a flight"}
        </GlassButton>
      </div>
    </div>
  );
}
