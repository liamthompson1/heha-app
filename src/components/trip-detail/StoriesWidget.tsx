"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import StoriesChat from "./StoriesChat";

interface StoriesResponse {
  text: string;
  title?: string;
  childResources?: Record<string, string>;
  parentResources?: Record<string, string>;
  variables?: Record<string, string>;
  modelId?: string | null;
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

/** Regex to detect story-navigation links: any href containing trips/{id}/{subPath} */
const TRIPS_PATH_RE = /trips\/[^/]+\/.+/;

/** Process HTML: classify links, wrap image grids */
function processHtml(html: string): string {
  // 1. Classify links in a single pass
  let result = html.replace(
    /<a\s+href="([^"]+)"/g,
    (_match, href: string) => {
      // Any link with a trips/{id}/... path is an in-container nav link
      if (TRIPS_PATH_RE.test(href)) {
        return `<a href="${href}" class="stories-nav-link"`;
      }
      // Other http(s) links are truly external
      if (/^https?:\/\//i.test(href)) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"`;
      }
      // Leave other links (mailto, tel, etc.) as-is
      return `<a href="${href}"`;
    }
  );

  // 2. Wrap 2+ consecutive image-bearing elements in a horizontal scroll.
  //    An "image element" is either a bare <img> or an <a> wrapping an <img>.
  //    Split HTML into tokens, find runs of image elements, wrap them.
  const imgToken = /(<a\b[^>]*>\s*<img\b[^>]*\/?\s*>\s*<\/a>|<img\b[^>]*\/?\s*>)/gi;
  const separator = /^(\s|<br\s*\/?>|<\/?p>)*$/i;
  const tokens = result.split(imgToken);
  let out = "";
  let run: string[] = [];
  const flushRun = () => {
    if (run.length >= 2) {
      out += '<div class="stories-image-scroll">' + run.join("") + "</div>";
    } else {
      out += run.join("");
    }
    run = [];
  };
  for (const token of tokens) {
    if (imgToken.test(token)) {
      imgToken.lastIndex = 0;
      run.push(token);
    } else if (run.length > 0 && separator.test(token)) {
      // whitespace/br/p between images — keep in the run
      run.push(token);
    } else {
      flushRun();
      out += token;
    }
  }
  flushRun();
  result = out;

  return result;
}

/** Substitute {varName} placeholders in a resource path using a variables map */
function resolveTemplate(
  template: string,
  variables: Record<string, string> | undefined
): string {
  if (!variables) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => variables[key] ?? `{${key}}`);
}

/** Extract subPath and query params from a resource path like "trips/{id}/{subPath}?params" */
function parseResourcePath(
  resourcePath: string,
  variables?: Record<string, string>
): {
  subPath: string;
  params: Record<string, string>;
} {
  const resolved = resolveTemplate(resourcePath, variables);
  const match = resolved.match(/trips\/[^/]+\/(.+?)(?:\?(.*))?$/);
  if (!match) return { subPath: "", params: {} };

  const subPath = match[1];
  const params: Record<string, string> = {};
  if (match[2]) {
    const sp = new URLSearchParams(match[2]);
    sp.forEach((value, key) => {
      params[key] = value;
    });
  }
  return { subPath, params };
}

export default function StoriesWidget({ tripId }: { tripId: string }) {
  const [data, setData] = useState<StoriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [navStack, setNavStack] = useState<string[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Accumulated URL params that persist across the entire navigation flow
  const accumulatedParams = useRef<Record<string, string>>({});

  const fetchStories = useCallback(
    async (subPath?: string, params?: Record<string, string>) => {
      setLoading(true);
      try {
        const url = new URL(`/api/trips/${tripId}/stories`, window.location.origin);
        if (subPath) url.searchParams.set("path", subPath);
        if (params) {
          for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
          }
        }
        const res = await fetch(url.toString());
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

  // Intercept clicks on story nav links (any link containing trips/{id}/{subPath})
  const handleNavClick = useCallback(
    (e: React.MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Extract trips/{id}/{subPath} from any href format:
      //   #nav/trips/{id}/path, nav/trips/{id}/path,
      //   https://example.com/trips/{id}/path, trips/{id}/path
      const match = href.match(/trips\/[^/]+\/(.+?)(?:\?|$)/);
      if (match) {
        e.preventDefault();
        const subPath = match[1];

        // Extract query params from the link and merge into accumulated params
        const queryIdx = href.indexOf("?");
        if (queryIdx !== -1) {
          const sp = new URLSearchParams(href.slice(queryIdx + 1));
          sp.forEach((value, key) => {
            accumulatedParams.current[key] = value;
          });
        }

        setTransitioning(true);
        setNavStack((prev) => [...prev, subPath]);
        fetchStories(subPath, { ...accumulatedParams.current }).then(() =>
          setTransitioning(false)
        );
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [fetchStories]
  );

  const handleChildResourceClick = useCallback(
    (resourcePath: string) => {
      const { subPath, params } = parseResourcePath(resourcePath, data?.variables);
      if (!subPath) return;

      // Merge params into accumulated
      Object.assign(accumulatedParams.current, params);

      setTransitioning(true);
      setNavStack((prev) => [...prev, subPath]);
      fetchStories(subPath, { ...accumulatedParams.current }).then(() =>
        setTransitioning(false)
      );
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [fetchStories, data?.variables]
  );

  const handleBack = useCallback(() => {
    setTransitioning(true);

    // Use parentResources if available
    if (data?.parentResources) {
      const parentEntries = Object.entries(data.parentResources);
      if (parentEntries.length > 0) {
        const [, resourcePath] = parentEntries[0];
        const { subPath, params } = parseResourcePath(resourcePath, data?.variables);
        Object.assign(accumulatedParams.current, params);

        const newStack = navStack.slice(0, -1);
        setNavStack(newStack);
        fetchStories(subPath || undefined, { ...accumulatedParams.current }).then(
          () => setTransitioning(false)
        );
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    // Fall back to navStack
    const newStack = navStack.slice(0, -1);
    setNavStack(newStack);
    const prevPath = newStack[newStack.length - 1];
    fetchStories(prevPath, { ...accumulatedParams.current }).then(() =>
      setTransitioning(false)
    );
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [navStack, fetchStories, data?.parentResources, data?.variables]);

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

  const headerTitle = data.title || "Your Trip";
  const childEntries = data.childResources
    ? Object.entries(data.childResources)
    : [];

  return (
    <div className="widget-section" ref={containerRef} onClick={handleNavClick}>
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
        <h2 className="widget-title">{headerTitle}</h2>
        {loading && (
          <span
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            Loading...
          </span>
        )}
      </div>
      <div className={`space-y-4 stories-content${transitioning ? " stories-content-loading" : ""}`}>
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
                __html: processHtml(section.html),
              }}
            />
          </div>
        ))}

        {childEntries.length > 0 && (
          <div className="stories-nav-buttons">
            {childEntries.map(([resourcePath, name]) => (
              <button
                key={resourcePath}
                className="stories-nav-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChildResourceClick(resourcePath);
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {data.modelId !== undefined && (
          <StoriesChat
            key={navStack.join("/")}
            tripId={tripId}
            modelId={data.modelId}
            variables={data.variables}
            storyText={data.text}
          />
        )}
      </div>
    </div>
  );
}
