"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import PageShell from "@/components/PageShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import GlassInput from "@/components/GlassInput";

export default function AuthEntryPage() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session.authenticated) {
      router.replace("/trips");
    }
  }, [session.authenticated, router]);

  async function handleLogin() {
    if (!email) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to send code. Please try again.");
        return;
      }

      router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    if (!email) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to continue as guest.");
        return;
      }

      router.push("/trips");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (session.loading || session.authenticated) {
    return (
      <PageShell backHref="/" centered>
        <div className="text-white/40 text-sm text-center">Loading…</div>
      </PageShell>
    );
  }

  return (
    <PageShell backHref="/" centered>
      <GlassCard shimmer className="max-w-md mx-auto">
        <h1 className="page-enter stagger-1 gradient-text text-3xl font-bold text-center mb-2">
          Welcome
        </h1>
        <p className="page-enter stagger-2 text-center text-sm text-white/50 mb-8">
          Sign in to start planning your next adventure.
        </p>

        <div className="page-enter stagger-3 mb-6">
          <GlassInput
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <div className="page-enter stagger-4 flex flex-col gap-3">
          <GlassButton
            variant="blue"
            className="w-full"
            disabled={!email || loading}
            onClick={handleLogin}
          >
            {loading ? "Sending\u2026" : "Login with Holiday Extras"}
          </GlassButton>
          <GlassButton
            variant="teal"
            className="w-full"
            disabled={!email || loading}
            onClick={handleGuest}
          >
            Continue as Guest
          </GlassButton>
        </div>
      </GlassCard>
    </PageShell>
  );
}
