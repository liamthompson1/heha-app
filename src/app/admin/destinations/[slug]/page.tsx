"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import {
  fetchDestination,
  fetchContentHistory,
} from "@/lib/api/destinations";
import type { Destination, ContentHistoryEntry } from "@/types/destination";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Badge({ variant, children }: { variant: "green" | "blue" | "orange" | "red"; children: React.ReactNode }) {
  const colors = {
    green: { bg: "rgba(46, 205, 193, 0.12)", border: "rgba(46, 205, 193, 0.25)", text: "var(--teal)" },
    blue: { bg: "rgba(90, 200, 250, 0.12)", border: "rgba(90, 200, 250, 0.25)", text: "var(--blue)" },
    orange: { bg: "rgba(240, 180, 41, 0.12)", border: "rgba(240, 180, 41, 0.25)", text: "var(--gold)" },
    red: { bg: "rgba(255, 99, 89, 0.12)", border: "rgba(255, 99, 89, 0.25)", text: "var(--coral)" },
  };
  const c = colors[variant];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      {children}
    </span>
  );
}

const STATUS_BADGE: Record<string, "green" | "orange" | "red"> = {
  published: "green",
  draft: "orange",
  pending_review: "red",
};

export default function AdminDestinationDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [destination, setDestination] = useState<Destination | null>(null);
  const [history, setHistory] = useState<ContentHistoryEntry[]>([]);
  const [view, setView] = useState<"preview" | "markdown">("preview");

  useEffect(() => {
    fetchDestination(slug).then(setDestination);
    fetchContentHistory(slug).then(setHistory);
  }, [slug]);

  if (!destination) {
    return (
      <AdminShell>
        <div className="py-16 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
          Loading...
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
            {destination.country} · {destination.continent}
          </p>
          <h1 className="gradient-text-subtle mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {destination.name}
          </h1>
          <p className="mt-2 max-w-xl text-base" style={{ color: "var(--text-secondary)" }}>
            {destination.summary}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <Badge variant={STATUS_BADGE[destination.status]}>
            {destination.status.replace("_", " ")}
          </Badge>
          <GlassButton href={`/destinations/${slug}`} size="sm">
            View Live ↗
          </GlassButton>
        </div>
      </div>

      {/* Metadata cards */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="glass-panel px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Last Updated
          </div>
          <div className="mt-1 text-sm" style={{ color: "var(--foreground)" }}>
            {new Date(destination.updated_at).toLocaleString("en-GB")}
          </div>
        </div>
        <div className="glass-panel px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Updated By
          </div>
          <div className="mt-1 text-sm" style={{ color: "var(--foreground)" }}>
            {destination.updated_by_name || "—"}
          </div>
        </div>
        <div className="glass-panel px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Tags
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {destination.tags.map((tag) => (
              <Badge key={tag} variant="blue">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 inline-flex gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1">
        <button
          onClick={() => setView("preview")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            view === "preview" ? "bg-white/10 text-white/90" : "text-white/40 hover:text-white/60"
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setView("markdown")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            view === "markdown" ? "bg-white/10 text-white/90" : "text-white/40 hover:text-white/60"
          }`}
        >
          Markdown
        </button>
      </div>

      {/* Content */}
      <GlassCard className="mb-10">
        {view === "preview" ? (
          <div className="glass-prose destination-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {destination.content_markdown}
            </ReactMarkdown>
          </div>
        ) : (
          <pre className="overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {destination.content_markdown}
          </pre>
        )}
      </GlassCard>

      {/* History */}
      <h2 className="mb-4 text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
        Content History
      </h2>
      <GlassCard flush>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/6">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Actor</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Action</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No history entries.
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr key={entry.id} className="border-b border-white/4 transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <span className="text-base">{entry.actor_type === "bot" ? "🤖" : "👤"}</span>
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{entry.actor_name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={entry.action === "create" ? "green" : "blue"}>
                      {entry.action}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {timeAgo(entry.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>
    </AdminShell>
  );
}
