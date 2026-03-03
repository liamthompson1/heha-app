"use client";

import type { VoiceState } from "@/hooks/useVoiceConversation";

interface MicButtonProps {
  voiceState: VoiceState;
  onClick: () => void;
}

function MicIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2" />
      <path d="M6 8v8" />
      <path d="M10 4v16" />
      <path d="M14 6v12" />
      <path d="M18 8v8" />
      <path d="M22 12h-2" />
    </svg>
  );
}

export default function MicButton({ voiceState, onClick }: MicButtonProps) {
  return (
    <button
      type="button"
      className="mic-button"
      data-state={voiceState}
      onClick={onClick}
      aria-label={
        voiceState === "idle" ? "Start listening" :
        voiceState === "listening" ? "Listening..." :
        voiceState === "processing" ? "Processing..." :
        "Tap to interrupt"
      }
    >
      {/* Listening: coral pulse rings */}
      {voiceState === "listening" && (
        <>
          <span className="mic-pulse-ring" />
          <span className="mic-pulse-ring" style={{ animationDelay: "0.5s" }} />
        </>
      )}

      {/* Processing: spinning ring */}
      {voiceState === "processing" && (
        <span className="mic-processing-ring" />
      )}

      {/* Speaking: expanding teal rings */}
      {voiceState === "speaking" && (
        <>
          <span className="mic-speak-ring" />
          <span className="mic-speak-ring" style={{ animationDelay: "0.6s" }} />
          <span className="mic-speak-ring" style={{ animationDelay: "1.2s" }} />
        </>
      )}

      {voiceState === "speaking" ? <WaveIcon /> : <MicIcon />}
    </button>
  );
}
