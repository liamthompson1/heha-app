"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface StoriesResponse {
  text: string;
  childResources?: Record<string, string>;
  variables?: Record<string, string>;
}

interface Section {
  title: string;
  html: string;
}

function parseStoriesHtml(html: string): Section[] {
  const parts = html.split(/<h2[^>]*>/i);
  return parts
    .slice(1) // skip content before first <h2>
    .map((part) => {
      const closeIdx = part.indexOf("</h2>");
      if (closeIdx === -1) return null;
      const title = part.slice(0, closeIdx).replace(/<[^>]+>/g, "").trim();
      const body = part.slice(closeIdx + 5).trim();
      if (!body) return null;
      return { title, html: body };
    })
    .filter(Boolean) as Section[];
}

/** Add target="_blank" to external links in the HTML */
function processExternalLinks(html: string): string {
  return html.replace(
    /<a\s+href="(https?:\/\/[^"]+)"/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  );
}

export default function StoriesWidget({ tripId }: { tripId: string }) {
  const [data, setData] = useState<StoriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [navStack, setNavStack] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchStories = useCallback(
    async (subPath?: string) => {
      setLoading(true);
      try {
        const url = subPath
          ? `/api/trips/${tripId}/stories?path=${encodeURIComponent(subPath)}`
          : `/api/trips/${tripId}/stories`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Intercept clicks on nav links (#nav/...)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Handle nav links
      if (href.startsWith("#nav/")) {
        e.preventDefault();
        // Extract the resource path after #nav/
        const fullPath = href.slice(5).split("?")[0]; // strip tracking params
        // Extract sub-path after "trips/{tripId}/"
        const match = fullPath.match(/^trips\/[^/]+\/(.+)$/);
        if (match) {
          setNavStack((prev) => [...prev, match[1]]);
          fetchStories(match[1]);
        }
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [fetchStories]);

  const handleBack = useCallback(() => {
    const newStack = navStack.slice(0, -1);
    setNavStack(newStack);
    const prevPath = newStack[newStack.length - 1];
    fetchStories(prevPath);
  }, [navStack, fetchStories]);

  if (loading && !data) {
    return (
      <div className="widget-section animate-pulse">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-6 h-6 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div className="glass-panel rounded-xl h-6 w-36" />
        </div>
        <div className="glass-panel rounded-2xl h-32" />
      </div>
    );
  }

  if (!data?.text) return null;

  const sections = parseStoriesHtml(data.text);
  if (sections.length === 0) return null;

  return (
    <div className="widget-section" ref={containerRef}>
      <div className="widget-header">
        {navStack.length > 0 && (
          <button
            onClick={handleBack}
            className="stories-back-btn"
            aria-label="Back"
          >
            &larr;
          </button>
        )}
        <span style={{ fontSize: "1.25rem" }}>&#127796;</span>
        <h2 className="widget-title">Your Trip</h2>
        {loading && (
          <span
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            Loading...
          </span>
        )}
      </div>
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="glass-panel stories-section-card">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              {section.title}
            </h3>
            <div
              className="stories-html-content"
              dangerouslySetInnerHTML={{
                __html: processExternalLinks(section.html),
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
