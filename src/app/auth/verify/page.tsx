"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "@/lib/auth/use-session";
import PageShell from "@/components/PageShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import OtpInput from "@/components/OtpInput";

function VerifyForm() {
  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (session.authenticated) {
      router.replace("/");
    }
  }, [session.authenticated, router]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (otp.length !== 6 || !email) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid code. Please try again.");
        return;
      }

      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to resend code.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (session.loading || session.authenticated) {
    return (
      <div className="max-w-md mx-auto w-full animate-pulse">
        <GlassCard>
          <div className="glass-panel rounded-xl h-8 w-44 mx-auto mb-2" />
          <div className="glass-panel rounded-xl h-4 w-64 mx-auto mb-8" />
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-xl w-11 h-14" />
            ))}
          </div>
          <div className="glass-panel rounded-2xl h-12 w-full" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto">
      {/* Brand glow behind card */}
      <div
        className="absolute -inset-20 -z-10 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(105,30,225,0.35) 0%, rgba(47,149,243,0.20) 50%, transparent 75%)',
        }}
      />
      <GlassCard shimmer elevated className="text-center">
        <h1 className="page-enter stagger-1 gradient-text text-3xl font-bold mb-2">
          Check your phone
        </h1>
        <p className="page-enter stagger-2 text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          We sent a 6-digit code to your phone{email ? ` for ${email}` : ""}.
        </p>

        <div className="page-enter stagger-3 mb-8">
          <OtpInput length={6} onChange={setOtp} onSubmit={handleVerify} />
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="page-enter stagger-4 mb-4">
          <GlassButton
            variant="blue"
            className="w-full"
            disabled={otp.length !== 6 || loading}
            onClick={handleVerify}
          >
            {loading ? "Verifying\u2026" : "Verify"}
          </GlassButton>
        </div>

        <p className="page-enter stagger-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Didn&rsquo;t get the code?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="underline underline-offset-2 transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-secondary)' }}
          >
            {resending ? "Resending\u2026" : "Resend"}
          </button>
        </p>
      </GlassCard>
    </div>
  );
}

export default function AuthVerifyPage() {
  return (
    <PageShell backHref="/auth/entry" centered>
      <Suspense>
        <VerifyForm />
      </Suspense>
    </PageShell>
  );
}
