"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as cache from "@/lib/cache";

interface UseCachedFetchOptions<T> {
  transform?: (raw: unknown) => T | null;
  /** Max age in ms before cache is considered stale. Default 2 min. */
  maxAge?: number;
}

interface UseCachedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  mutate: (data: T | null) => void;
}

export function useCachedFetch<T>(
  url: string | null,
  options?: UseCachedFetchOptions<T>
): UseCachedFetchResult<T> {
  const transformRef = useRef(options?.transform);
  transformRef.current = options?.transform;
  const maxAge = options?.maxAge ?? cache.DEFAULT_MAX_AGE_MS;

  const cached = url ? cache.get<T>(url) : undefined;
  const isFresh = url ? !!cache.getFresh<T>(url, maxAge) : false;

  const [data, setData] = useState<T | null>(cached ?? null);
  // If we have a fresh cache hit, don't show loading at all
  const [loading, setLoading] = useState(!isFresh && cached === undefined && url !== null);
  const [error, setError] = useState("");

  const mutate = useCallback(
    (newData: T | null) => {
      setData(newData);
      if (url && newData !== null) {
        cache.set(url, newData);
      } else if (url) {
        cache.del(url);
      }
    },
    [url]
  );

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    // If cache is fresh, skip the network request entirely
    const freshData = cache.getFresh<T>(url, maxAge);
    if (freshData !== undefined) {
      setData(freshData);
      setLoading(false);
      return;
    }

    // If we have stale data, show it immediately but still fetch
    const staleData = cache.get<T>(url);
    if (staleData !== undefined) {
      setData(staleData);
      setLoading(false); // Don't show loading — we have data to display
    }

    let cancelled = false;

    fetch(url)
      .then(async (res) => {
        const text = await res.text();
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(
            `Server returned non-JSON (${res.status}): ${text.slice(0, 200)}`
          );
        }
        if (!res.ok) {
          const msg =
            (json as Record<string, string>)?.error || `API error ${res.status}`;
          throw new Error(msg);
        }
        return json;
      })
      .then((raw) => {
        if (cancelled) return;
        const transformed = transformRef.current ? transformRef.current(raw) : (raw as T);
        setData(transformed);
        setError("");
        if (transformed !== null) {
          cache.set(url, transformed);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Only show error if we don't have stale data to display
        if (!staleData) {
          setError(err.message || "Fetch failed");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, maxAge]);

  return { data, loading, error, mutate };
}
