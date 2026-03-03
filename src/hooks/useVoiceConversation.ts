"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TripData } from "@/types/trip";
import type { ChatMessage, AgentChatResponse, SavedMemory } from "@/types/agent";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface UseVoiceConversationOptions {
  tripData: TripData;
  onTripDataChange: (data: TripData) => void;
  userId: string | null;
}

interface UseVoiceConversationReturn {
  voiceState: VoiceState;
  formComplete: boolean;
  lastMemories: SavedMemory[];
  handleMicClick: () => void;
}

export function useVoiceConversation({
  tripData,
  onTripDataChange,
  userId,
}: UseVoiceConversationOptions): UseVoiceConversationReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);
  const autoListenRef = useRef(false);
  const memoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      autoListenRef.current = false;
      recognitionRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (memoryTimerRef.current) {
        clearTimeout(memoryTimerRef.current);
      }
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!mountedRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      if (mountedRef.current) setVoiceState("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript && mountedRef.current) {
        autoListenRef.current = true; // successful speech → keep loop alive
        sendToAgent(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!mountedRef.current) return;
      if (event.error === "no-speech" || event.error === "aborted") {
        // No speech or aborted — break auto-listen loop
        autoListenRef.current = false;
        setVoiceState("idle");
      } else {
        autoListenRef.current = false;
        setVoiceState("idle");
      }
    };

    recognition.onend = () => {
      // Only go idle if we didn't transition to processing
      if (mountedRef.current && voiceState === "listening") {
        // Will be handled by onresult or onerror
      }
    };

    recognition.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speakResponse = useCallback(
    async (text: string) => {
      if (!mountedRef.current) return;
      setVoiceState("speaking");

      try {
        const res = await fetch("/api/agent/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) throw new Error("TTS failed");

        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          if (!mountedRef.current) return;

          if (autoListenRef.current) {
            // Auto-listen after TTS finishes
            setTimeout(() => {
              if (mountedRef.current && autoListenRef.current) {
                startListening();
              }
            }, 300);
          } else {
            setVoiceState("idle");
          }
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          if (mountedRef.current) {
            setVoiceState("idle");
          }
        };

        await audio.play();
      } catch {
        if (mountedRef.current) {
          setVoiceState("idle");
        }
      }
    },
    [startListening]
  );

  const sendToAgent = useCallback(
    async (transcript: string) => {
      if (!mountedRef.current) return;
      setVoiceState("processing");
      setLastMemories([]);

      const userMessage: ChatMessage = { role: "user", content: transcript };
      historyRef.current = [...historyRef.current, userMessage];

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

        if (!mountedRef.current) return;

        onTripDataChange(data.updatedTripData);

        if (data.memories.length > 0) {
          setLastMemories(data.memories);
          // Auto-clear memory chips after 3 seconds
          if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
          memoryTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setLastMemories([]);
          }, 3000);
        }

        if (data.formComplete) {
          setFormComplete(true);
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.message,
        };
        historyRef.current = [...historyRef.current, assistantMessage];

        // Speak the response
        await speakResponse(data.message);
      } catch {
        if (mountedRef.current) {
          autoListenRef.current = false;
          setVoiceState("idle");
        }
      }
    },
    [onTripDataChange, userId, speakResponse]
  );

  const handleMicClick = useCallback(() => {
    if (voiceState === "speaking") {
      // Interrupt TTS and start listening
      stopAudio();
      autoListenRef.current = true;
      startListening();
      return;
    }

    if (voiceState !== "idle") return;

    autoListenRef.current = true;
    startListening();
  }, [voiceState, stopAudio, startListening]);

  return {
    voiceState,
    formComplete,
    lastMemories,
    handleMicClick,
  };
}
