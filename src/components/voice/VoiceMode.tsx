"use client";

import { useState, useCallback, useRef } from "react";
import type { TripData } from "@/types/trip";
import MicButton from "./MicButton";
import VoiceTranscript from "./VoiceTranscript";
import GlassButton from "@/components/GlassButton";

const DEMO_LINES = [
  "I'd like to plan a holiday...",
  "Flying to Barcelona...",
  "Sometime in July, about 10 days...",
  "Two people travelling...",
  "We'll fly from London Heathrow...",
];

interface VoiceModeProps {
  tripData: TripData;
  onTripDataChange: (data: TripData) => void;
  onComplete: () => void;
}

export default function VoiceMode({ tripData, onTripDataChange, onComplete }: VoiceModeProps) {
  const [listening, setListening] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [agentResponse, setAgentResponse] = useState("Tap the microphone and tell me about your trip.");
  const lineIdx = useRef(0);

  const handleMicClick = useCallback(() => {
    if (listening) return;

    setListening(true);

    setTimeout(() => {
      setListening(false);
      const nextLine = DEMO_LINES[lineIdx.current % DEMO_LINES.length];
      setLines((prev) => [...prev, nextLine]);
      lineIdx.current += 1;

      // Simulate agent processing
      setTimeout(() => {
        if (lineIdx.current >= DEMO_LINES.length) {
          setAgentResponse("Got it all! Your trip is ready to plan.");
          onTripDataChange({
            ...tripData,
            reason: tripData.reason || "Holiday",
            name: tripData.name || "Barcelona Getaway",
            how_we_are_travelling: tripData.how_we_are_travelling || "Flying",
            dates: {
              ...tripData.dates,
              start_date: tripData.dates.start_date || "2026-07-10",
              end_date: tripData.dates.end_date || "2026-07-20",
            },
            journey_locations: {
              ...tripData.journey_locations,
              travelling_from: tripData.journey_locations.travelling_from || "London",
              travelling_to: tripData.journey_locations.travelling_to || "Barcelona",
              nearest_airport: tripData.journey_locations.nearest_airport || "LHR",
            },
          });
        } else {
          const responses = [
            "A holiday — lovely! Keep going...",
            "Flying to Barcelona, got it!",
            "July for about 10 days, perfect.",
            "Two travelers, noted.",
            "London Heathrow — great.",
          ];
          setAgentResponse(responses[(lineIdx.current - 1) % responses.length]);
        }
      }, 500);
    }, 2000);
  }, [listening, tripData, onTripDataChange]);

  const done = lineIdx.current >= DEMO_LINES.length;

  return (
    <div className="flex flex-col items-center" style={{ minHeight: "60vh" }}>
      <h2 className="wizard-question mb-2 text-center">Tell us about your trip</h2>
      <p className="wizard-hint mb-10 text-center">Tap the mic and start talking</p>

      <MicButton listening={listening} onClick={handleMicClick} />

      {listening && (
        <p className="mt-4 text-sm text-coral animate-pulse">Listening...</p>
      )}

      <VoiceTranscript lines={lines} />

      {agentResponse && (
        <p className="mt-6 text-center text-sm max-w-md page-enter" style={{ color: 'var(--text-secondary)' }}>
          {agentResponse}
        </p>
      )}

      {done && (
        <div className="mt-10">
          <GlassButton variant="coral" onClick={onComplete}>
            Plan My Trip
          </GlassButton>
        </div>
      )}
    </div>
  );
}
