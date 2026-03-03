"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TripData } from "@/types/trip";
import type { ChatMessage, AgentChatResponse, SavedMemory } from "@/types/agent";
import MicButton from "./MicButton";
import VoiceTranscript from "./VoiceTranscript";
import AgentThinking from "@/components/agent/AgentThinking";
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
  const [listening, setListening] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [agentResponse, setAgentResponse] = useState(
    "Tap the microphone and tell me about your trip."
  );
  const [thinking, setThinking] = useState(false);
  const [formComplete, setFormComplete] = useState(false);
  const [lastMemories, setLastMemories] = useState<SavedMemory[]>([]);
  const historyRef = useRef<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your Heeha travel assistant. Tap the mic and tell me about the trip you're planning!",
    },
  ]);
  const tripDataRef = useRef(tripData);
  tripDataRef.current = tripData;
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const sendToAgent = useCallback(
    async (transcript: string) => {
      const userMessage: ChatMessage = { role: "user", content: transcript };
      historyRef.current = [...historyRef.current, userMessage];
      setThinking(true);
      setLastMemories([]);

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyRef.current,
            tripData: tripDataRef.current,
            sessionId: "voice",
            userId,
          }),
        });

        if (!res.ok) throw new Error("API request failed");

        const data: AgentChatResponse = await res.json();

        onTripDataChange(data.updatedTripData);

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
        historyRef.current = [...historyRef.current, assistantMessage];
        setAgentResponse(data.message);
      } catch {
        setAgentResponse("Sorry, something went wrong. Tap the mic and try again.");
      } finally {
        setThinking(false);
      }
    },
    [onTripDataChange, userId]
  );

  const handleMicClick = useCallback(() => {
    if (listening || thinking) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAgentResponse(
        "Speech recognition isn't supported in your browser. Try Chrome or Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setLines((prev) => [...prev, transcript]);
        sendToAgent(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setListening(false);
      if (event.error === "no-speech") {
        setAgentResponse("I didn't catch anything — tap the mic and try again.");
      } else if (event.error !== "aborted") {
        setAgentResponse("Microphone error. Please check permissions and try again.");
      }
    };

    recognition.onend = () => setListening(false);

    recognition.start();
  }, [listening, thinking, sendToAgent]);

  return (
    <div className="flex flex-col items-center" style={{ minHeight: "60vh" }}>
      <h2 className="wizard-question mb-2 text-center">Tell us about your trip</h2>
      <p className="wizard-hint mb-10 text-center">Tap the mic and start talking</p>

      <MicButton listening={listening} onClick={handleMicClick} />

      {listening && (
        <p className="mt-4 text-sm text-coral animate-pulse">Listening...</p>
      )}

      <VoiceTranscript lines={lines} />

      {thinking && (
        <div className="mt-6">
          <AgentThinking />
        </div>
      )}

      {!thinking && agentResponse && (
        <p className="mt-6 text-center text-white/70 text-sm max-w-md page-enter">
          {agentResponse}
        </p>
      )}

      {lastMemories.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {lastMemories.map((m) => (
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
