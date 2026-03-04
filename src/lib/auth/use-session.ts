"use client";

import { useState, useEffect } from "react";
import * as cache from "@/lib/cache";

interface SessionState {
  authenticated: boolean;
  email: string | null;
  userId: string | null;
  loading: boolean;
}

const CACHE_KEY = "/api/auth/session";

type SessionData = Omit<SessionState, "loading">;

export function useSession(): SessionState {
  const cached = cache.get<SessionData>(CACHE_KEY);

  const [state, setState] = useState<SessionState>(
    cached
      ? { ...cached, loading: false }
      : { authenticated: false, email: null, userId: null, loading: true }
  );

  useEffect(() => {
    let cancelled = false;

    fetch(CACHE_KEY)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const session: SessionData = {
          authenticated: !!data.authenticated,
          email: data.email ?? null,
          userId: data.userId ?? null,
        };
        cache.set(CACHE_KEY, session);
        setState({ ...session, loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ authenticated: false, email: null, userId: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
