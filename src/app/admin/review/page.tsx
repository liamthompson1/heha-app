"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import { fetchDestinations } from "@/lib/api/destinations";
import type { Destination } from "@/types/destination";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ReviewQueuePage() {
  const [pending, setPending] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchDestinations({ status: "pending_review" }).then((d) => {
      setPending(d);
      setLoading(false);
    });
  }, []);

  return (
    <AdminShell>
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
          Moderation
        </p>
        <h1 className="gradient-text-subtle mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Review Queue
        </h1>
      </div>

      {loading ? (
        <GlassCard>
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Loading...
          </div>
        </GlassCard>
      ) : pending.length === 0 ? (
        <GlassCard>
          <div className="py-16 text-center">
            <div className="mb-4 text-4xl">✓</div>
            <p className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
              All clear
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
              No content pending review.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((d) => (
            <GlassCard key={d.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                    {d.name}
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {d.country} · by {d.updated_by_name || "unknown"} ·{" "}
                    {new Date(d.updated_at).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <GlassButton
                    size="sm"
                    onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                  >
                    {expanded === d.id ? "Collapse" : "Preview"}
                  </GlassButton>
                  <GlassButton size="sm" variant="teal">
                    Approve
                  </GlassButton>
                  <GlassButton size="sm" variant="coral">
                    Reject
                  </GlassButton>
                </div>
              </div>
              {expanded === d.id && (
                <div className="mt-5 border-t border-white/6 pt-5">
                  <div className="glass-prose max-h-[400px] overflow-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {d.content_markdown}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
