"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { encodeWav } from "@/lib/voice/wav-encoder";
import { AudioStreamer } from "@/lib/voice/audio-streamer";
import type { TripData } from "@/types/trip";
import type { ChatMessage, AgentChatResponse, SavedMemory } from "@/types/agent";

export type VoiceState =
  | "inactive"
  | "active-idle"
  | "listening"
  | "processing"
  | "speaking";

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

/** Detect if browser has native Web Speech API (Chrome/Edge) */
function hasWebSpeechAPI(): boolean {
  return typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function useRealtimeVoice({
  tripData,
  onTripDataChange,
  userId,
}: UseRealtimeVoiceOptions): UseRealtimeVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>("inactive");
  const [formComplete, setFormComplete] = useState(false);
  const [lastMemories, setLastMemories] = useState<SavedMemory[]>([]);
  const [lastTranscript, setLastTranscript] = useState("");

  // Refs to avoid stale closures
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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const webSpeechTranscriptRef = useRef<string>("");
  const activeRef = useRef(false); // whether voice agent is active (user toggled on)

  const historyRef = useRef<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your Heeha travel assistant. Tap the mic and tell me about the trip you're planning!",
    },
  ]);

  // Ref-stable callbacks
  const sendToAgentRef = useRef<(transcript: string) => Promise<void>>(null!);
  const speakResponseRef = useRef<(text: string) => Promise<void>>(null!);

  // Lazy-init AudioContext on first user gesture (Safari requirement)
  const getAudioCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // --- Barge-in: abort in-flight requests + stop audio ---
  const bargeIn = useCallback(() => {
    // Cancel any in-flight fetch (chat or TTS)
    abortRef.current?.abort();
    abortRef.current = null;

    // Stop audio playback
    streamerRef.current?.stop();
    streamerRef.current = null;

    // Stop Web Speech recognition if running
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    webSpeechTranscriptRef.current = "";
  }, []);

  // --- Web Speech API for Chrome fast-path ---
  const startWebSpeech = useCallback(() => {
    if (!hasWebSpeechAPI()) return;

    recognitionRef.current?.abort();
    webSpeechTranscriptRef.current = "";

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        webSpeechTranscriptRef.current = transcript;
      }
    };

    recognition.onerror = () => {
      // Silently handle — VAD fallback will kick in
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognition.start();
  }, []);

  const stopWebSpeech = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  // --- Server-side STT fallback (Safari/Firefox) ---
  const transcribeOnServer = useCallback(
    async (audioData: Float32Array, signal: AbortSignal): Promise<string> => {
      const wavBlob = encodeWav(audioData, 16000);
      const formData = new FormData();
      formData.append("audio", wavBlob, "audio.wav");

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
        signal,
      });

      if (!res.ok) throw new Error(`Transcribe failed: ${res.status}`);
      const data = await res.json();
      return data.text ?? "";
    },
    []
  );

  // --- Send transcript to agent ---
  sendToAgentRef.current = async (transcript: string) => {
    if (!mountedRef.current || !activeRef.current) return;

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

      if (!mountedRef.current || !activeRef.current) return;

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
      if ((err as Error).name === "AbortError") return; // barge-in
      console.error("Agent chat error:", err);
      if (mountedRef.current && activeRef.current) {
        setVoiceState("active-idle");
      }
    }
  };

  // --- Speak response via streaming TTS ---
  speakResponseRef.current = async (text: string) => {
    if (!mountedRef.current || !activeRef.current) return;

    setVoiceState("speaking");

    const ctx = getAudioCtx();
    const streamer = new AudioStreamer(ctx);
    streamerRef.current = streamer;

    const controller = new AbortController();
    abortRef.current = controller;

    streamer.onComplete(() => {
      if (!mountedRef.current || !activeRef.current) return;
      streamerRef.current = null;
      setVoiceState("active-idle");
    });

    try {
      const res = await fetch("/api/agent/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

      await streamer.stream(res);
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // barge-in
      console.error("TTS playback error:", err);
      if (mountedRef.current && activeRef.current) {
        streamerRef.current = null;
        setVoiceState("active-idle");
      }
    }
  };

  // --- VAD ---
  const vad = useMicVAD({
    startOnLoad: false,
    positiveSpeechThreshold: 0.6,
    baseAssetPath: "/",
    onnxWASMBasePath: "/",
    onSpeechStart: () => {
      if (!mountedRef.current || !activeRef.current) return;

      // Barge-in if currently speaking or processing
      if (
        voiceStateRef.current === "speaking" ||
        voiceStateRef.current === "processing"
      ) {
        bargeIn();
      }

      setVoiceState("listening");

      // Start Web Speech for Chrome fast-path
      if (hasWebSpeechAPI()) {
        startWebSpeech();
      }
    },
    onSpeechEnd: (audio: Float32Array) => {
      if (!mountedRef.current || !activeRef.current) return;

      stopWebSpeech();

      // Chrome fast-path: use Web Speech transcript if available
      const webTranscript = webSpeechTranscriptRef.current;
      webSpeechTranscriptRef.current = "";

      if (webTranscript) {
        sendToAgentRef.current?.(webTranscript);
        return;
      }

      // Safari/Firefox fallback: send audio to server for STT
      const controller = new AbortController();
      abortRef.current = controller;

      transcribeOnServer(audio, controller.signal)
        .then((text) => {
          if (text && mountedRef.current && activeRef.current) {
            sendToAgentRef.current?.(text);
          } else if (mountedRef.current && activeRef.current) {
            // Empty transcript — back to idle
            setVoiceState("active-idle");
          }
        })
        .catch((err) => {
          if ((err as Error).name === "AbortError") return;
          console.error("Server STT error:", err);
          if (mountedRef.current && activeRef.current) {
            setVoiceState("active-idle");
          }
        });
    },
  });

  // Log VAD errors
  useEffect(() => {
    if (vad.errored) {
      console.error("VAD error:", vad.errored);
    }
  }, [vad.errored]);

  // --- Toggle voice on/off ---
  const toggleVoice = useCallback(() => {
    const state = voiceStateRef.current;

    if (state === "inactive") {
      // Activate
      activeRef.current = true;
      getAudioCtx(); // Init audio context on user gesture
      vad.start();
      setVoiceState("active-idle");
      return;
    }

    if (state === "speaking") {
      // Barge-in: stop audio, VAD will pick up new speech
      bargeIn();
      setVoiceState("active-idle");
      return;
    }

    // Any other active state → deactivate
    bargeIn();
    activeRef.current = false;
    vad.pause();
    setVoiceState("inactive");
  }, [bargeIn, getAudioCtx, vad]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRef.current = false;
      abortRef.current?.abort();
      streamerRef.current?.stop();
      recognitionRef.current?.abort();
      if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  return {
    voiceState,
    formComplete,
    lastMemories,
    lastTranscript,
    toggleVoice,
  };
}
