"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { TripData } from "@/types/trip";
import type { ChatMessage, AgentChatResponse, SavedMemory } from "@/types/agent";
import AgentMessage from "@/components/agent/AgentMessage";
import AgentThinking from "@/components/agent/AgentThinking";
import GlassButton from "@/components/GlassButton";

interface UnifiedTripProps {
  tripData: TripData;
  onTripDataChange: (data: TripData) => void;
  onComplete: () => void;
  userId: string | null;
  initialMessage?: string;
  editMode?: boolean;
  editTripId?: string;
  collectField?: string;
}

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface ChipOption {
  icon: string;
  label: string;
  value: string;
}

const GREETING =
  "Hey! I'm your HEHA travel assistant. Where are you off to? You can type, tap an option, or use the mic!";

const EDIT_GREETING =
  "Hey! I'm here to help you update your trip. What would you like to change?";

const REASON_CHIPS: ChipOption[] = [
  { icon: "🏖", label: "Holiday", value: "Holiday" },
  { icon: "💼", label: "Business", value: "Business" },
  { icon: "💍", label: "Honeymoon", value: "Honeymoon" },
  { icon: "👨‍👩‍👧‍👦", label: "Family", value: "Family trip" },
  { icon: "🏔", label: "Adventure", value: "Adventure" },
  { icon: "✨", label: "Other", value: "Other" },
];

const DESTINATION_CHIPS: ChipOption[] = [
  { icon: "🇪🇸", label: "Spain", value: "Spain" },
  { icon: "🇵🇹", label: "Portugal", value: "Portugal" },
  { icon: "🇫🇷", label: "France", value: "France" },
  { icon: "🇮🇹", label: "Italy", value: "Italy" },
  { icon: "🇬🇷", label: "Greece", value: "Greece" },
  { icon: "🇹🇷", label: "Turkey", value: "Turkey" },
];

const PEOPLE_CHIPS: ChipOption[] = [
  { icon: "🧑", label: "Just me", value: "Just me" },
  { icon: "👫", label: "Couple", value: "2 of us, a couple" },
  { icon: "👨‍👩‍👧", label: "Family", value: "Family trip" },
  { icon: "👥", label: "Group", value: "A group of friends" },
];

const UK_ORIGIN_CHIPS: ChipOption[] = [
  { icon: "🏙", label: "London", value: "London" },
  { icon: "🏙", label: "Manchester", value: "Manchester" },
  { icon: "🏙", label: "Birmingham", value: "Birmingham" },
  { icon: "🏙", label: "Edinburgh", value: "Edinburgh" },
  { icon: "🏙", label: "Bristol", value: "Bristol" },
  { icon: "🏙", label: "Glasgow", value: "Glasgow" },
];

function getDateChips(): ChipOption[] {
  const now = new Date();
  const chips: ChipOption[] = [];
  for (let i = 1; i <= 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = d.toLocaleString("en-GB", { month: "long" });
    const year = d.getFullYear();
    chips.push({
      icon: "📅",
      label: monthName,
      value: `${monthName} ${year}`,
    });
  }
  return chips;
}

/** Get suggestion chips based on which field is next needed */
function getNextChips(tripData: TripData): ChipOption[] | null {
  if (!tripData.reason) return REASON_CHIPS;
  if (!tripData.journey_locations?.travelling_to) return DESTINATION_CHIPS;
  if (!tripData.dates?.start_date) return getDateChips();
  if (!tripData.people_travelling?.length) return PEOPLE_CHIPS;
  if (!tripData.journey_locations?.travelling_from) return UK_ORIGIN_CHIPS;
  return null;
}

export default function UnifiedTrip({
  tripData,
  onTripDataChange,
  onComplete,
  userId,
  initialMessage,
  editMode,
  editTripId,
  collectField,
}: UnifiedTripProps) {
  // --- Render state ---
  const [history, setHistory] = useState<ChatMessage[]>([
    { role: "assistant", content: editMode ? EDIT_GREETING : GREETING },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [formComplete, setFormComplete] = useState(false);
  const [lastMemories, setLastMemories] = useState<SavedMemory[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [conversationActive, setConversationActive] = useState(false);

  // --- Refs (stale-closure prevention) ---
  const historyRef = useRef(history);
  historyRef.current = history;
  const tripDataRef = useRef(tripData);
  tripDataRef.current = tripData;
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;
  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;
  const conversationActiveRef = useRef(conversationActive);
  conversationActiveRef.current = conversationActive;
  const onTripDataChangeRef = useRef(onTripDataChange);
  onTripDataChangeRef.current = onTripDataChange;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const editModeRef = useRef(editMode);
  editModeRef.current = editMode;
  const collectFieldRef = useRef(collectField);
  collectFieldRef.current = collectField;

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch {}
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Auto-send initial message (for "collect" flow from trip detail)
  const initialSentRef = useRef(false);
  useEffect(() => {
    if (initialMessage && !initialSentRef.current && sendMessageRef.current) {
      initialSentRef.current = true;
      // Delay slightly to allow form data to settle
      const t = setTimeout(() => sendMessageRef.current?.(initialMessage, false), 500);
      return () => clearTimeout(t);
    }
  }, [initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, thinking]);

  // Auto-focus input after morph animation (desktop only — avoids keyboard pop on mobile)
  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 550);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard-aware positioning via visualViewport (Safari iOS fix)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      if (!floatingRef.current) return;
      const kbHeight = window.innerHeight - vv.height;
      if (kbHeight > 50) {
        floatingRef.current.style.bottom = `${kbHeight + 8}px`;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        floatingRef.current.style.bottom = "";
      }
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

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
      const chatEndpoint = editModeRef.current ? "/api/agent/edit-chat" : "/api/agent/chat";
      const res = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          tripData: tripDataRef.current,
          sessionId: "unified",
          userId: userIdRef.current,
          ...(editModeRef.current && { collectField: collectFieldRef.current }),
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
        if (useVoice && !conversationActiveRef.current) setVoiceState("idle");
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

      await new Promise<void>((resolve) => {
        source.onended = () => {
          audioSourceRef.current = null;
          resolve();
        };
        source.start(0);
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("TTS error:", err);
    } finally {
      if (mountedRef.current) {
        if (conversationActiveRef.current) {
          startListening();
        } else {
          setVoiceState("idle");
        }
      }
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
      if (voiceStateRef.current === "listening") setVoiceState("idle");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (!mountedRef.current) return;

      if (transcript && voiceStateRef.current === "listening") {
        sendMessageRef.current?.(transcript, true);
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

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch {}
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
  }, []);

  const handleMicClick = useCallback(() => {
    if (conversationActiveRef.current) {
      // Stop conversation
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
  // Determine which suggestion chips to show
  // ————————————————————————————————————————
  const chips = !thinking ? getNextChips(tripData) : null;

  // Get voice status text for the mic tooltip
  const micLabel = conversationActive
    ? voiceState === "listening"
      ? "Listening... tap to stop"
      : voiceState === "processing"
        ? "Processing... tap to stop"
        : voiceState === "speaking"
          ? "Speaking... tap to stop"
          : "Tap to start conversation"
    : "Tap to start conversation";

  return (
    <div className="flex flex-col flex-1 pb-28">
      {/* ——— Chat thread ——— */}
      <div
        className="flex-1 space-y-3 mb-4 overflow-y-auto px-1"
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

        {/* Suggestion chips */}
        {!thinking && chips && (
          <div className="prompt-chips-row">
            {chips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className="prompt-chip"
                onClick={() => handleVisualSelect(chip.value)}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ——— Input bar (fixed to bottom with morph animation) ——— */}
      {formComplete ? (
        <div ref={floatingRef} className="unified-input-floating">
          <GlassButton variant="coral" className="w-full" onClick={onComplete}>
            {editMode ? "Save Changes" : "Plan My Trip"}
          </GlassButton>
        </div>
      ) : (
        <div ref={floatingRef} className="unified-input-floating">
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
              className="voice-icon-btn morph-btn-enter"
              data-state={voiceState}
              data-conversation={conversationActive || undefined}
              onClick={handleMicClick}
              aria-label={micLabel}
              title={micLabel}
            >
              {voiceState === "listening" && (
                <span className="voice-btn-pulse" />
              )}
              {conversationActive && voiceState !== "idle" ? (
                voiceState === "speaking" ? <WaveIconSmall /> : <StopIconSmall />
              ) : voiceState === "speaking" ? (
                <WaveIconSmall />
              ) : (
                <MicIconSmall />
              )}
            </button>

            <button
              type="button"
              className="send-icon-btn morph-btn-enter"
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ————————————————————————————————————————
// Sub-components
// ————————————————————————————————————————

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

function StopIconSmall() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
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
