import type { SavedMemory, FlightCardData } from "@/types/agent";
import FlightCardList from "./FlightCard";

interface AgentMessageProps {
  role: "user" | "agent";
  text: string;
  memories?: SavedMemory[];
  imagePreview?: string;
  flightCards?: FlightCardData[];
  onFlightSelect?: (card: FlightCardData) => void;
}

export default function AgentMessage({ role, text, memories, imagePreview, flightCards, onFlightSelect }: AgentMessageProps) {
  return (
    <div className={`chat-bubble chat-bubble-${role}`}>
      {imagePreview && (
        <img
          src={imagePreview}
          alt="Uploaded"
          className="chat-bubble-image"
        />
      )}
      {text}
      {flightCards && flightCards.length > 0 && onFlightSelect && (
        <FlightCardList
          cards={flightCards}
          onSelect={onFlightSelect}
        />
      )}
      {memories && memories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {memories.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs text-purple-300 border border-purple-500/30"
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
    </div>
  );
}
