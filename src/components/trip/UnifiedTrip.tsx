"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { TripData } from "@/types/trip";
import type { ChatMessage, AgentChatResponse, SavedMemory } from "@/types/agent";
import { getMissingRequiredFields } from "@/lib/agent/trip-data-schema";
import { WIZARD_STEPS } from "@/lib/wizard-steps";
import AgentMessage from "@/components/agent/AgentMessage";
import AgentThinking from "@/components/agent/AgentThinking";
import GlassButton from "@/components/GlassButton";

interface UnifiedTripProps {
  tripData: TripData;
  onTripDataChange: (data: TripData) => void;
  onComplete: () => void;
  userId: string | null;
}

type VoiceState = "idle" | "listening" | "processing" | "speaking";

const GREETING =
  "Hey! I'm your Heeha travel assistant. Tell me about the trip you're planning — where are you going, when, who's coming? You can type, tap the options below, or use the mic!";

/** Map the first missing required field to a visual prompt type */
function getNextVisual(tripData: TripData): string | null {
  const missing = getMissingRequiredFields(tripData);
  if (missing.length === 0) return null;
  const first = missing[0];
  if (first === "reason") return "reason";
  if (first === "how_we_are_travelling") return "travel-mode";
  return null;
}

export default function UnifiedTrip({
  tripData,
  onTripDataChange,
  onComplete,
  userId,
}: UnifiedTripProps) {
  // --- Render state ---
  const [history, setHistory] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [formComplete, setFormComplete] = useState(false);
  const [lastMemories, setLastMemories] = useState<SavedMemory[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  // --- Refs (stale-closure prevention) ---
  const historyRef = useRef(history);
  historyRef.current = history;
  const tripDataRef = useRef(tripData);
  tripDataRef.current = tripData;
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;
  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;
  const onTripDataChangeRef = useRef(onTripDataChange);
  onTripDataChangeRef.current = onTripDataChange;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Mutable function refs
  const sendMessageRef = useRef<
    (text: string, useVoice?: boolean) => Promise<void>
  >(null!);
  const speakResponseRef = useRef<(text: string) => Promise<void>>(null!);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      recognitionRef.current?.abort();
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, thinking]);

  // ————————————————————————————————————————
  // Core: send message to agent
  // ————————————————————————————————————————
  sendMessageRef.current = async (
    text: string,
    useVoice: boolean = false
  ) => {
    if (!text.trim() || thinkingRef.current) return;

    setLastMemories([]);
    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    const updatedHistory = [...historyRef.current, userMessage];
    historyRef.current = updatedHistory;
    setHistory(updatedHistory);
    setThinking(true);
    if (useVoice) setVoiceState("processing");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          tripData: tripDataRef.current,
          sessionId: "unified",
          userId: userIdRef.current,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("API request failed");
      const data: AgentChatResponse = await res.json();

      if (!mountedRef.current) return;

      onTripDataChangeRef.current(data.updatedTripData);
      if (data.memories.length > 0) setLastMemories(data.memories);
      if (data.formComplete) setFormComplete(true);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
      };
      historyRef.current = [...historyRef.current, assistantMessage];
      setHistory([...historyRef.current]);

      // Speak response if voice was used
      if (useVoice && mountedRef.current) {
        await speakResponseRef.current?.(data.message);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Chat error:", err);
      if (mountedRef.current) {
        const errorMsg: ChatMessage = {
          role: "assistant",
          content: "Sorry, something went wrong. Could you try that again?",
        };
        historyRef.current = [...historyRef.current, errorMsg];
        setHistory([...historyRef.current]);
      }
    } finally {
      if (mountedRef.current) {
        setThinking(false);
        if (useVoice) setVoiceState("idle");
      }
    }
  };

  // ————————————————————————————————————————
  // TTS: speak agent response
  // ————————————————————————————————————————
  speakResponseRef.current = async (text: string) => {
    if (!mountedRef.current) return;
    setVoiceState("speaking");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/agent/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resolve();
        };
        audio.play();
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("TTS error:", err);
    } finally {
      if (mountedRef.current) setVoiceState("idle");
    }
  };

  // ————————————————————————————————————————
  // Voice: Web Speech API
  // ————————————————————————————————————————
  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      console.error("Speech recognition not supported");
      return;
    }

    recognitionRef.current?.abort();

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.continuous = true;

    let transcript = "";

    recognition.onstart = () => {
      if (mountedRef.current) setVoiceState("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      transcript = full;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!mountedRef.current) return;
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("Speech error:", event.error);
      }
      if (voiceStateRef.current === "listening") setVoiceState("idle");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!mountedRef.current) return;
      if (transcript && voiceStateRef.current === "listening") {
        sendMessageRef.current?.(transcript, true);
      } else if (voiceStateRef.current === "listening") {
        setVoiceState("idle");
      }
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
  }, []);

  const handleMicClick = useCallback(() => {
    const state = voiceStateRef.current;
    if (state === "idle") {
      startListening();
      return;
    }
    if (state === "listening") {
      stopListening();
      return;
    }
    if (state === "speaking") {
      abortRef.current?.abort();
      stopAudio();
      setVoiceState("idle");
      return;
    }
    // processing — ignore
  }, [startListening, stopListening, stopAudio]);

  // ————————————————————————————————————————
  // Text send
  // ————————————————————————————————————————
  const handleSend = useCallback(() => {
    if (!input.trim() || thinkingRef.current) return;
    const text = input.trim();
    setInput("");
    sendMessageRef.current?.(text, false);
  }, [input]);

  // ————————————————————————————————————————
  // Visual card tap
  // ————————————————————————————————————————
  const handleVisualSelect = useCallback((value: string) => {
    if (thinkingRef.current) return;
    sendMessageRef.current?.(value, false);
  }, []);

  // ————————————————————————————————————————
  // Determine which visual prompt to show
  // ————————————————————————————————————————
  const nextVisual = !thinking ? getNextVisual(tripData) : null;

  // Get voice status text for the mic tooltip
  const micLabel =
    voiceState === "idle"
      ? "Tap to speak"
      : voiceState === "listening"
        ? "Tap to stop"
        : voiceState === "speaking"
          ? "Tap to interrupt"
          : "Processing...";

  return (
    <div className="flex flex-col" style={{ minHeight: "70vh" }}>
      {/* ——— Chat thread ——— */}
      <div
        className="flex-1 space-y-3 mb-4 overflow-y-auto px-1"
        style={{ maxHeight: "60vh" }}
      >
        {history.map((msg, i) => (
          <AgentMessage
            key={i}
            role={msg.role === "user" ? "user" : "agent"}
            text={msg.content}
            memories={
              msg.role === "assistant" && i === history.length - 1
                ? lastMemories
                : undefined
            }
          />
        ))}

        {thinking && <AgentThinking />}

        {/* Inline visual prompt chips */}
        {!thinking && nextVisual && (
          <PromptChips type={nextVisual} onSelect={handleVisualSelect} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ——— Input bar ——— */}
      {formComplete ? (
        <GlassButton variant="coral" className="w-full" onClick={onComplete}>
          Plan My Trip
        </GlassButton>
      ) : (
        <div className="unified-input-bar">
          {/* Voice state indicator */}
          {voiceState === "listening" && (
            <span className="voice-listening-dot" />
          )}

          <input
            ref={inputRef}
            type="text"
            className="glass-input flex-1"
            placeholder={
              voiceState === "listening"
                ? "Listening..."
                : voiceState === "processing"
                  ? "Thinking..."
                  : voiceState === "speaking"
                    ? "Speaking..."
                    : "Tell me about your trip..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={voiceState !== "idle"}
          />

          <button
            type="button"
            className="voice-icon-btn"
            data-state={voiceState}
            onClick={handleMicClick}
            aria-label={micLabel}
            title={micLabel}
          >
            {voiceState === "listening" && (
              <span className="voice-btn-pulse" />
            )}
            {voiceState === "speaking" ? <WaveIconSmall /> : <MicIconSmall />}
          </button>

          <button
            type="button"
            className="send-icon-btn"
            onClick={handleSend}
            disabled={!input.trim() || thinking}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      )}
    </div>
  );
}

// ————————————————————————————————————————
// Sub-components
// ————————————————————————————————————————

function PromptChips({
  type,
  onSelect,
}: {
  type: string;
  onSelect: (value: string) => void;
}) {
  const step = type === "reason" ? WIZARD_STEPS[0] : WIZARD_STEPS[2];

  return (
    <div className="prompt-chips-row">
      {step.options!.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="prompt-chip"
          onClick={() => onSelect(opt.value)}
        >
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function MicIconSmall() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function WaveIconSmall() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12h2" />
      <path d="M6 8v8" />
      <path d="M10 4v16" />
      <path d="M14 6v12" />
      <path d="M18 8v8" />
      <path d="M22 12h-2" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
