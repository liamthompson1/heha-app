"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

interface StoriesChatProps {
  tripId: string;
  modelId: string;
  variables?: Record<string, string>;
  storyText: string;
}

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

type VoiceState = "idle" | "listening" | "processing" | "speaking";

/** Lightweight markdown → HTML for agent messages */
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML entities
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links [text](url)
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="stories-nav-link">$1</a>'
    )
    // Line breaks
    .replace(/\n/g, "<br>");
  return html;
}

export default function StoriesChat({
  tripId,
  modelId,
  variables,
  storyText,
}: StoriesChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice state
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const voiceStateRef = useRef<VoiceState>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Keep voiceStateRef in sync
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Whether to show thinking dots: streaming and last message is empty agent message
  const showThinking = useMemo(
    () =>
      streaming &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "agent" &&
      messages[messages.length - 1].text === "",
    [streaming, messages]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showThinking]);

  // Cleanup on unmount
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
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, []);

  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`/api/trips/${tripId}/stories/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, variables }),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error("[StoriesChat] Create conversation failed:", res.status, errBody);
        return null;
      }
      const data = await res.json();
      const id = data.conversationId;
      setConversationId(id);
      return id;
    } catch (err) {
      console.error("[StoriesChat] Create conversation error:", err);
      return null;
    }
  }, [tripId, modelId, variables]);

  // ————————————————————————————————————————
  // TTS: speak agent response
  // ————————————————————————————————————————
  const speakResponse = useCallback(async (text: string) => {
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
        setVoiceState("idle");
      }
    }
  }, []);

  // ————————————————————————————————————————
  // Voice: stop audio helper
  // ————————————————————————————————————————
  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch {}
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
  }, []);

  // ————————————————————————————————————————
  // Voice: send message (core logic)
  // ————————————————————————————————————————
  const sendMessageCore = useCallback(async (text: string, useVoice: boolean) => {
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setStreaming(true);
    if (useVoice) setVoiceState("processing");

    // Lazy conversation creation
    let convId = conversationId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) {
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: "Unable to connect. Check the console for details." },
        ]);
        setStreaming(false);
        if (useVoice) setVoiceState("idle");
        return;
      }
    }

    // Add empty agent message to fill via streaming
    setMessages((prev) => [...prev, { role: "agent", text: "" }]);

    let fullResponse = "";

    try {
      const res = await fetch(
        `/api/trips/${tripId}/stories/conversations/${convId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId,
            messages: [{ text }],
            variables,
            storyText,
          }),
        }
      );

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        console.error("[StoriesChat] Stream failed:", res.status, errText);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "agent",
            text: "Something went wrong. Please try again.",
          };
          return copy;
        });
        setStreaming(false);
        if (useVoice) setVoiceState("idle");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              fullResponse += parsed.text;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = {
                  ...last,
                  text: last.text + parsed.text,
                };
                return copy;
              });
            }
          } catch {
            // skip malformed SSE
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[copy.length - 1]?.text === "") {
          copy[copy.length - 1] = {
            role: "agent",
            text: "Connection error. Please try again.",
          };
        }
        return copy;
      });
    } finally {
      setStreaming(false);
    }

    // Speak the response if voice-triggered
    if (useVoice && fullResponse && mountedRef.current) {
      speakResponse(fullResponse);
    } else if (useVoice) {
      setVoiceState("idle");
    }
  }, [
    streaming,
    messages,
    conversationId,
    createConversation,
    tripId,
    modelId,
    variables,
    storyText,
    speakResponse,
  ]);

  // Text-only send (from input bar)
  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || streaming) return;
    sendMessageCore(text, false);
  }, [input, streaming, sendMessageCore]);

  // ————————————————————————————————————————
  // Voice: Web Speech API listening
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
        sendMessageCore(transcript, true);
      } else if (voiceStateRef.current === "listening") {
        setVoiceState("idle");
      }
    };

    recognition.start();
  }, [sendMessageCore]);

  // ————————————————————————————————————————
  // Voice: mic button handler
  // ————————————————————————————————————————
  const handleMicClick = useCallback(() => {
    const isActive = voiceStateRef.current !== "idle";

    if (isActive) {
      // Stop everything
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
      startListening();
    }
  }, [startListening, stopAudio]);

  // Filter out empty agent messages for display (they only exist as streaming placeholders)
  const visibleMessages = messages.filter(
    (msg) => !(msg.role === "agent" && msg.text === "")
  );

  return createPortal(
    <>
      {/* Message overlay — only visible when there are messages or thinking */}
      {(visibleMessages.length > 0 || showThinking) && (
        <div className="stories-chat-overlay">
          <div className="stories-chat-messages">
            <button
              className="stories-chat-close"
              onClick={() => { setMessages([]); setStreaming(false); }}
              aria-label="Clear chat"
            >
              &times;
            </button>
            {visibleMessages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${
                  msg.role === "user" ? "chat-bubble-user" : "chat-bubble-agent"
                }`}
              >
                {msg.role === "agent" ? (
                  <span
                    className="stories-agent-text"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(msg.text),
                    }}
                  />
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {showThinking && (
              <div className="chat-bubble chat-bubble-agent">
                <span className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Floating input at bottom of page */}
      <div className="stories-chat-floating">
        <div className="unified-input-bar">
          <input
            ref={inputRef}
            className="glass-input flex-1"
            type="text"
            placeholder="Ask about this..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={streaming || voiceState !== "idle"}
          />
          {voiceState === "listening" && <span className="voice-listening-dot" />}
          <button
            type="button"
            className="voice-icon-btn"
            data-state={voiceState}
            onClick={handleMicClick}
            disabled={streaming}
            aria-label={voiceState === "idle" ? "Start voice input" : "Stop voice"}
          >
            {voiceState === "listening" && <span className="voice-btn-pulse" />}
            {voiceState === "speaking" ? <WaveIconSmall /> :
             voiceState !== "idle" ? <StopIconSmall /> : <MicIconSmall />}
          </button>
          <button
            className="send-icon-btn"
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            aria-label="Send"
          >
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
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

// ————————————————————————————————————————
// SVG icons for voice button
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
