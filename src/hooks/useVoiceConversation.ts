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

  // Use refs for everything callbacks need to avoid stale closures
  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;

  const historyRef = useRef<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your Heeha travel assistant. Tap the mic and tell me about the trip you're planning!",
    },
  ]);
  const tripDataRef = useRef(tripData);
  tripDataRef.current = tripData;

  const onTripDataChangeRef = useRef(onTripDataChange);
  onTripDataChangeRef.current = onTripDataChange;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);
  const autoListenRef = useRef(false);
  const memoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store callbacks in refs so they're always fresh
  const speakResponseRef = useRef<(text: string) => Promise<void>>(null!);
  const sendToAgentRef = useRef<(transcript: string) => Promise<void>>(null!);
  const startListeningRef = useRef<() => void>(null!);

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
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
  }, []);

  // Define startListening — reads sendToAgentRef at call-time, no stale closure
  startListeningRef.current = () => {
    if (!mountedRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    // Abort any previous recognition
    recognitionRef.current?.abort();

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
        autoListenRef.current = true;
        sendToAgentRef.current?.(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!mountedRef.current) return;
      autoListenRef.current = false;
      setVoiceState("idle");
      // Silently handle no-speech and aborted — these are expected
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("SpeechRecognition error:", event.error);
      }
    };

    recognition.onend = () => {
      // If we're still in "listening" state when recognition ends without
      // onresult or onerror, go back to idle
      if (mountedRef.current && voiceStateRef.current === "listening") {
        autoListenRef.current = false;
        setVoiceState("idle");
      }
    };

    recognition.start();
  };

  // Define speakResponse — reads startListeningRef at call-time
  speakResponseRef.current = async (text: string) => {
    if (!mountedRef.current) return;
    setVoiceState("speaking");

    try {
      const res = await fetch("/api/agent/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        if (!mountedRef.current) return;

        if (autoListenRef.current) {
          setTimeout(() => {
            if (mountedRef.current && autoListenRef.current) {
              startListeningRef.current?.();
            }
          }, 300);
        } else {
          setVoiceState("idle");
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        if (mountedRef.current) setVoiceState("idle");
      };

      await audio.play();
    } catch (err) {
      console.error("TTS playback error:", err);
      if (mountedRef.current) {
        // TTS failed — still auto-listen so conversation continues
        if (autoListenRef.current) {
          setTimeout(() => {
            if (mountedRef.current && autoListenRef.current) {
              startListeningRef.current?.();
            }
          }, 300);
        } else {
          setVoiceState("idle");
        }
      }
    }
  };

  // Define sendToAgent — reads speakResponseRef at call-time
  sendToAgentRef.current = async (transcript: string) => {
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
          userId: userIdRef.current,
        }),
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

      // Speak the response via TTS
      await speakResponseRef.current?.(data.message);
    } catch (err) {
      console.error("Agent chat error:", err);
      if (mountedRef.current) {
        autoListenRef.current = false;
        setVoiceState("idle");
      }
    }
  };

  const handleMicClick = useCallback(() => {
    const state = voiceStateRef.current;

    if (state === "speaking") {
      // Interrupt TTS and start listening
      stopAudio();
      autoListenRef.current = true;
      startListeningRef.current?.();
      return;
    }

    if (state !== "idle") return;

    autoListenRef.current = true;
    startListeningRef.current?.();
  }, [stopAudio]);

  return {
    voiceState,
    formComplete,
    lastMemories,
    handleMicClick,
  };
}
