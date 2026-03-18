"use client";

import { useSession } from "@/lib/auth/use-session";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as cache from "@/lib/cache";

export default function AuthStatus() {
  const { authenticated, email } = useSession();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!authenticated) return null;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      cache.clear();
      window.location.href = "/";
    } catch {
      setLoggingOut(false);
    }
  }

  const truncatedEmail =
    email && email.length > 20 ? email.slice(0, 18) + "\u2026" : email;

  return (
    <div className="fixed right-4 top-4 z-50 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-md sm:right-6 sm:top-6">
      {truncatedEmail && (
        <span className="text-white/50 hidden sm:inline">{truncatedEmail}</span>
      )}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-white/60 hover:text-white/80 transition-colors disabled:opacity-50"
      >
        {loggingOut ? "Logging out\u2026" : "Log out"}
      </button>
    </div>
  );
}
