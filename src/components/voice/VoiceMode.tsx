"use client";

import type { TripData } from "@/types/trip";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import MicButton from "./MicButton";
import GlassButton from "@/components/GlassButton";

interface VoiceModeProps {
  tripData: TripData;
  onTripDataChange: (data: TripData) => void;
  onComplete: () => void;
  userId: string | null;
}

export default function VoiceMode({
  tripData,
  onTripDataChange,
  onComplete,
  userId,
}: VoiceModeProps) {
  const { voiceState, conversationActive, formComplete, lastMemories, lastTranscript, toggleVoice } =
    useRealtimeVoice({
      tripData,
      onTripDataChange,
      userId,
    });

  const statusText = conversationActive
    ? voiceState === "listening"
      ? "Listening... tap to stop"
      : voiceState === "processing"
        ? "Thinking..."
        : voiceState === "speaking"
          ? "Speaking... tap to stop"
          : "Tap to start conversation"
    : "Tap to start conversation";

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
      <MicButton voiceState={voiceState} conversationActive={conversationActive} onClick={toggleVoice} />

      <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        {statusText}
      </p>

      {voiceState === "processing" && lastTranscript && (
        <p
          className="mt-2 max-w-xs text-center text-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          &ldquo;{lastTranscript}&rdquo;
        </p>
      )}

      {lastMemories.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {lastMemories.map((m) => (
            <span
              key={m.id}
              className="memory-chip inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs text-purple-300 border border-purple-500/30"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              Remembered
            </span>
          ))}
        </div>
      )}

      {formComplete && (
        <div className="mt-10">
          <GlassButton variant="coral" onClick={onComplete}>
            Plan My Trip
          </GlassButton>
        </div>
      )}
    </div>
  );
}
