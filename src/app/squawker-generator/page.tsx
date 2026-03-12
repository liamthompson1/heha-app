"use client";

import { useState, useRef } from "react";
import PageShell from "@/components/PageShell";

export default function SquawkerGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/images/squawker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setImageUrl(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!imageUrl || !linkRef.current) return;
    linkRef.current.href = imageUrl;
    linkRef.current.download = `squawker-${Date.now()}.png`;
    linkRef.current.click();
  }

  return (
    <PageShell backHref="/">
      <div className="squawker-gen-container">
        <div className="squawker-gen-header">
          <img src="/heha-bird.png" alt="Squawker" className="squawker-gen-logo" />
          <h1 className="squawker-gen-title">Squawker Generator</h1>
          <p className="squawker-gen-subtitle">
            Describe a scene and generate a custom image of the HEHA! parrot
          </p>
        </div>

        <div className="squawker-gen-input-row">
          <textarea
            className="squawker-gen-input"
            placeholder="e.g. The parrot relaxing on a beach in the Maldives at sunset..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            rows={3}
            disabled={loading}
          />
          <button
            className="squawker-gen-btn"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <span className="squawker-gen-spinner" />
            ) : (
              "Generate"
            )}
          </button>
        </div>

        {error && (
          <div className="squawker-gen-error">{error}</div>
        )}

        {loading && (
          <div className="squawker-gen-loading">
            <div className="squawker-gen-loading-card glass-panel animate-pulse">
              <div className="squawker-gen-loading-shimmer" />
            </div>
            <p className="squawker-gen-loading-text">Generating your Squawker image...</p>
          </div>
        )}

        {imageUrl && !loading && (
          <div className="squawker-gen-result">
            <div className="squawker-gen-image-wrap glass-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Generated Squawker" className="squawker-gen-image" />
            </div>
            <button className="squawker-gen-download" onClick={handleDownload}>
              Download Image
            </button>
          </div>
        )}

        {/* Hidden download link */}
        <a ref={linkRef} style={{ display: "none" }} />
      </div>
    </PageShell>
  );
}
