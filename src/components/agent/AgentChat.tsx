"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { TripData } from "@/types/trip";
import type { ChatMessage, AgentChatResponse, SavedMemory } from "@/types/agent";
import AgentMessage from "./AgentMessage";
import AgentThinking from "./AgentThinking";
import GlassButton from "@/components/GlassButton";

interface AgentChatProps {
  tripData: TripData;
  onTripDataChange: (data: TripData) => void;
  onComplete: () => void;
  userId: string | null;
}

const GREETING =
  "Hey! I'm your Heeha travel assistant. Tell me about the trip you're planning — where are you going, when, who's coming? The more you share, the faster we'll get you sorted!";

export default function AgentChat({
  tripData,
  onTripDataChange,
  onComplete,
  userId,
}: AgentChatProps) {
  const [history, setHistory] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [formComplete, setFormComplete] = useState(false);
  const [lastMemories, setLastMemories] = useState<SavedMemory[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tripDataRef = useRef(tripData);
  tripDataRef.current = tripData;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, thinking]);

  const send = useCallback(async () => {
    if (!input.trim() || thinking) return;

    const userText = input.trim();
    setInput("");
    setLastMemories([]);

    const userMessage: ChatMessage = { role: "user", content: userText };
    const updatedHistory = [...history, userMessage];
    setHistory(updatedHistory);
    setThinking(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          tripData: tripDataRef.current,
          sessionId: "default",
          userId,
        }),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const data: AgentChatResponse = await res.json();

      // Replace tripData with server's updated version
      onTripDataChange(data.updatedTripData);

      // Track saved memories for display
      if (data.memories.length > 0) {
        setLastMemories(data.memories);
      }

      if (data.formComplete) {
        setFormComplete(true);
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
      };
      setHistory((prev) => [...prev, assistantMessage]);
    } catch {
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Could you try that again?",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking, history, onTripDataChange, userId]);

  return (
    <div className="flex flex-col" style={{ minHeight: "60vh" }}>
      <div className="glass-panel flex-1 space-y-3 mb-6 overflow-y-auto rounded-2xl p-4" style={{ maxHeight: '50vh' }}>
        {history.map((msg, i) => (
          <AgentMessage
            key={i}
            role={msg.role === "user" ? "user" : "agent"}
            text={msg.content}
            memories={
              // Show memories on the last assistant message
              msg.role === "assistant" && i === history.length - 1
                ? lastMemories
                : undefined
            }
          />
        ))}
        {thinking && <AgentThinking />}
        <div ref={bottomRef} />
      </div>

      {formComplete ? (
        <GlassButton variant="coral" className="w-full" onClick={onComplete}>
          Plan My Trip
        </GlassButton>
      ) : (
        <div className="flex gap-3 rounded-2xl p-3" style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: 'rgba(255,255,255,0.04)' }}>
          <input
            type="text"
            className="glass-input flex-1"
            placeholder="Tell me about your trip..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <GlassButton
            variant="blue"
            onClick={send}
            disabled={!input.trim() || thinking}
          >
            Send
          </GlassButton>
        </div>
      )}
    </div>
  );
}
