"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface StoriesChatProps {
  tripId: string;
  modelId: string | null;
  variables?: Record<string, string>;
  storyText: string;
}

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

export default function StoriesChat({
  tripId,
  modelId,
  variables,
  storyText,
}: StoriesChatProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  const createConversation = useCallback(async (): Promise<string | null> => {
    // Anthropic fallback doesn't need a real conversation
    if (modelId === null) {
      setConversationId("fallback");
      return "fallback";
    }

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

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setStreaming(true);

    // Lazy conversation creation
    let convId = conversationId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) {
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: "Failed to start conversation. Please try again." },
        ]);
        setStreaming(false);
        return;
      }
    }

    // Add empty agent message to fill via streaming
    setMessages((prev) => [...prev, { role: "agent", text: "" }]);

    try {
      const bodyMessages =
        modelId === null
          ? updatedMessages.map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              text: m.text,
            }))
          : [{ text }];

      const res = await fetch(
        `/api/trips/${tripId}/stories/conversations/${convId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId,
            messages: bodyMessages,
            variables,
            storyText,
          }),
        }
      );

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "agent",
            text: "Something went wrong. Please try again.",
          };
          return copy;
        });
        setStreaming(false);
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
  }, [
    input,
    streaming,
    messages,
    conversationId,
    createConversation,
    tripId,
    modelId,
    variables,
    storyText,
  ]);

  if (!expanded) {
    return (
      <button
        className="stories-chat-toggle"
        onClick={() => setExpanded(true)}
      >
        Ask about this
      </button>
    );
  }

  return (
    <div className="stories-chat-container glass-panel">
      <div className="stories-chat-header">
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Ask about this
        </span>
        <button
          className="stories-chat-close"
          onClick={() => setExpanded(false)}
          aria-label="Close chat"
        >
          &times;
        </button>
      </div>

      <div className="stories-chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${
              msg.role === "user" ? "chat-bubble-user" : "chat-bubble-agent"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {streaming && messages[messages.length - 1]?.text === "" && (
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

      <div className="stories-chat-input-wrap">
        <div className="unified-input-bar">
          <input
            ref={inputRef}
            className="glass-input flex-1"
            type="text"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={streaming}
          />
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
    </div>
  );
}
