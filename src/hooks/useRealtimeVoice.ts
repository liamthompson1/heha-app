"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TripData } from "@/types/trip";
import type { ChatMessage, AgentChatResponse, SavedMemory } from "@/types/agent";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface UseRealtimeVoiceOptions {
  tripData: TripData;
  onTripDataChange: (data: TripData) => void;
  userId: string | null;
}

interface UseRealtimeVoiceReturn {
  voiceState: VoiceState;
  formComplete: boolean;
  lastMemories: SavedMemory[];
  lastTranscript: string;
  toggleVoice: () => void;
}

export function useRealtimeVoice({
  tripData,
  onTripDataChange,
  userId,
}: UseRealtimeVoiceOptions): UseRealtimeVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [formComplete, setFormComplete] = useState(false);
  const [lastMemories, setLastMemories] = useState<SavedMemory[]>([]);
  const [lastTranscript, setLastTranscript] = useState("");

  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;

  const tripDataRef = useRef(tripData);
  tripDataRef.current = tripData;

  const onTripDataChangeRef = useRef(onTripDataChange);
  onTripDataChangeRef.current = onTripDataChange;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const mountedRef = useRef(true);
  const memoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const historyRef = useRef<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your Heeha travel assistant. Tap the mic and tell me about the trip you're planning!",
    },
  ]);

  const sendToAgentRef = useRef<(transcript: string) => Promise<void>>(null!);
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
      if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
  }, []);

  // --- Start listening via Web Speech API ---
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
      // Accumulate all results
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
      if (voiceStateRef.current === "listening") {
        setVoiceState("idle");
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!mountedRef.current) return;

      // If we have a transcript, send it
      if (transcript && voiceStateRef.current === "listening") {
        sendToAgentRef.current?.(transcript);
      } else if (voiceStateRef.current === "listening") {
        setVoiceState("idle");
      }
    };

    recognition.start();
  }, []);

  // --- Stop listening and process ---
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // --- Send transcript to agent ---
  sendToAgentRef.current = async (transcript: string) => {
    if (!mountedRef.current) return;

    setVoiceState("processing");
    setLastTranscript(transcript);
    setLastMemories([]);

    const userMessage: ChatMessage = { role: "user", content: transcript };
    historyRef.current = [...historyRef.current, userMessage];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyRef.current,
          tripData: tripDataRef.current,
          sessionId: "voice",
          userId: userIdRef.current,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("API request failed");

      const data: AgentChatResponse = await res.json();

      if (!mountedRef.current) return;

      onTripDataChangeRef.current(data.updatedTripData);

      if (data.memories.length > 0) {
        setLastMemories(data.memories);
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

      await speakResponseRef.current?.(data.message);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Agent chat error:", err);
      if (mountedRef.current) setVoiceState("idle");
    }
  };

  // --- Speak response via TTS (mp3 via <audio>) ---
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

      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        if (mountedRef.current) setVoiceState("idle");
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        if (mountedRef.current) setVoiceState("idle");
      };

      await audio.play();
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("TTS error:", err);
      if (mountedRef.current) setVoiceState("idle");
    }
  };

  // --- Toggle: tap to start/stop listening, or interrupt speaking ---
  const toggleVoice = useCallback(() => {
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
      // Stop audio, go back to idle
      abortRef.current?.abort();
      stopAudio();
      setVoiceState("idle");
      return;
    }

    // processing — ignore taps
  }, [startListening, stopListening, stopAudio]);

  return {
    voiceState,
    formComplete,
    lastMemories,
    lastTranscript,
    toggleVoice,
  };
}
