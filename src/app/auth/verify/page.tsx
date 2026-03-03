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
      router.replace("/trips");
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

      router.push("/trips");
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
    return <div className="text-white/40 text-sm text-center">Loading…</div>;
  }

  return (
    <GlassCard shimmer className="max-w-md mx-auto text-center">
      <h1 className="page-enter stagger-1 gradient-text text-3xl font-bold mb-2">
        Check your phone
      </h1>
      <p className="page-enter stagger-2 text-sm text-white/50 mb-8">
        We sent a 6-digit code to your phone{email ? ` for ${email}` : ""}.
      </p>

      <div className="page-enter stagger-3 mb-8">
        <OtpInput length={6} onChange={setOtp} />
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

      <p className="page-enter stagger-5 text-xs text-white/40">
        Didn&rsquo;t get the code?{" "}
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-white/60 underline underline-offset-2 hover:text-white/80 transition-colors disabled:opacity-50"
        >
          {resending ? "Resending\u2026" : "Resend"}
        </button>
      </p>
    </GlassCard>
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
