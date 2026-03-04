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
  conversationActive: boolean;
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
  const [conversationActive, setConversationActive] = useState(false);
  const [formComplete, setFormComplete] = useState(false);
  const [lastMemories, setLastMemories] = useState<SavedMemory[]>([]);
  const [lastTranscript, setLastTranscript] = useState("");

  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;

  const conversationActiveRef = useRef(conversationActive);
  conversationActiveRef.current = conversationActive;

  const tripDataRef = useRef(tripData);
  tripDataRef.current = tripData;

  const onTripDataChangeRef = useRef(onTripDataChange);
  onTripDataChangeRef.current = onTripDataChange;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const mountedRef = useRef(true);
  const memoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const historyRef = useRef<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your HEHA travel assistant. Tap the mic and tell me about the trip you're planning!",
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
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch {}
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch {}
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
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
    recognition.interimResults = true;
    recognition.continuous = true;

    let transcript = "";

    recognition.onstart = () => {
      if (mountedRef.current) setVoiceState("listening");
      // Initial timeout: if user doesn't speak at all, stop after 8s
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 8000);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Build transcript from final results only
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        }
      }
      transcript = final;

      // Reset silence timer: 2s after last speech activity
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 2000);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!mountedRef.current) return;

      if (event.error === "no-speech" && conversationActiveRef.current) {
        setTimeout(() => {
          if (mountedRef.current && conversationActiveRef.current) {
            startListening();
          }
        }, 300);
        return;
      }

      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("Speech error:", event.error);
      }
      if (voiceStateRef.current === "listening") {
        setVoiceState("idle");
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (!mountedRef.current) return;

      if (transcript && voiceStateRef.current === "listening") {
        sendToAgentRef.current?.(transcript);
      } else if (voiceStateRef.current === "listening") {
        if (conversationActiveRef.current) {
          setTimeout(() => {
            if (mountedRef.current && conversationActiveRef.current) {
              startListening();
            }
          }, 300);
        } else {
          setVoiceState("idle");
        }
      }
    };

    recognition.start();
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
      if (mountedRef.current) {
        if (conversationActiveRef.current) {
          startListening();
        } else {
          setVoiceState("idle");
        }
      }
    }
  };

  // --- Speak response via TTS (Web Audio API for Safari iOS compatibility) ---
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

      const arrayBuffer = await res.arrayBuffer();

      const audioCtx = audioCtxRef.current;
      if (!audioCtx) throw new Error("AudioContext not initialized");
      await audioCtx.resume();

      // Cross-browser decodeAudioData (callback form works on older Safari)
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
      });

      // Bail if user stopped during decode
      if (!mountedRef.current || voiceStateRef.current === "idle") return;

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      audioSourceRef.current = source;

      source.onended = () => {
        audioSourceRef.current = null;
        if (!mountedRef.current) return;
        if (conversationActiveRef.current) {
          startListening();
        } else {
          setVoiceState("idle");
        }
      };

      source.start(0);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("TTS error:", err);
      if (mountedRef.current) {
        if (conversationActiveRef.current) {
          startListening();
        } else {
          setVoiceState("idle");
        }
      }
    }
  };

  // --- Toggle: conversation mode on/off ---
  const toggleVoice = useCallback(() => {
    if (conversationActiveRef.current) {
      // Stop everything
      setConversationActive(false);
      conversationActiveRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      abortRef.current?.abort();
      stopAudio();
      setVoiceState("idle");
    } else {
      // Create and unlock AudioContext on user gesture (required for Safari iOS)
      if (!audioCtxRef.current) {
        const Ctor = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new Ctor();
      }
      audioCtxRef.current.resume().catch(() => {});

      // Start conversation
      setConversationActive(true);
      conversationActiveRef.current = true;
      startListening();
    }
  }, [startListening, stopAudio]);

  return {
    voiceState,
    conversationActive,
    formComplete,
    lastMemories,
    lastTranscript,
    toggleVoice,
  };
}
