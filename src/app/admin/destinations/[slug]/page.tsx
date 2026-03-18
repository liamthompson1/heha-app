"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
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

const STATUS_BADGE: Record<string, string> = {
  published: "hx-badge-green",
  draft: "hx-badge-orange",
  pending_review: "hx-badge-red",
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
        <div className="hx-text-tertiary" style={{ padding: "60px 0", textAlign: "center" }}>
          Loading...
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <p className="hx-eyebrow" style={{ marginBottom: 8 }}>
            {destination.country} · {destination.continent}
          </p>
          <h1 className="hx-heading" style={{ fontSize: 48 }}>
            {destination.name}
          </h1>
          <p
            className="hx-text-secondary"
            style={{ fontSize: 16, marginTop: 8, maxWidth: 600 }}
          >
            {destination.summary}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span className={`hx-badge ${STATUS_BADGE[destination.status]}`}>
            {destination.status.replace("_", " ")}
          </span>
          <Link href={`/destinations/${slug}`} className="hx-btn-secondary hx-btn-sm">
            View Live ↗
          </Link>
        </div>
      </div>

      {/* Metadata cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <div className="hx-glass-subtle" style={{ padding: "16px 20px" }}>
          <div className="hx-text-tertiary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Last Updated
          </div>
          <div className="hx-text-primary" style={{ fontSize: 14, marginTop: 4 }}>
            {new Date(destination.updated_at).toLocaleString("en-GB")}
          </div>
        </div>
        <div className="hx-glass-subtle" style={{ padding: "16px 20px" }}>
          <div className="hx-text-tertiary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Updated By
          </div>
          <div className="hx-text-primary" style={{ fontSize: 14, marginTop: 4 }}>
            {destination.updated_by_name || "—"}
          </div>
        </div>
        <div className="hx-glass-subtle" style={{ padding: "16px 20px" }}>
          <div className="hx-text-tertiary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Tags
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {destination.tags.map((tag) => (
              <span key={tag} className="hx-badge hx-badge-blue">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="hx-tabs" style={{ display: "inline-flex", marginBottom: 24 }}>
        <button
          onClick={() => setView("preview")}
          className={`hx-tab ${view === "preview" ? "hx-tab-active" : ""}`}
        >
          Preview
        </button>
        <button
          onClick={() => setView("markdown")}
          className={`hx-tab ${view === "markdown" ? "hx-tab-active" : ""}`}
        >
          Markdown
        </button>
      </div>

      {/* Content */}
      <div className="hx-glass" style={{ padding: 32, marginBottom: 40 }}>
        {view === "preview" ? (
          <div className="glass-prose destination-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {destination.content_markdown}
            </ReactMarkdown>
          </div>
        ) : (
          <pre className="hx-code-block" style={{ margin: 0, border: "none", borderRadius: 0, background: "transparent" }}>
            {destination.content_markdown}
          </pre>
        )}
      </div>

      {/* History */}
      <h2
        className="hx-text-primary"
        style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}
      >
        Content History
      </h2>
      <div className="hx-glass hx-table-wrap" style={{ padding: 0 }}>
        <table className="hx-table">
          <thead>
            <tr>
              <th>Actor</th>
              <th>Action</th>
              <th style={{ textAlign: "right" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="hx-text-tertiary"
                  style={{ textAlign: "center", padding: "24px 16px" }}
                >
                  No history entries.
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>
                        {entry.actor_type === "bot" ? "🤖" : "👤"}
                      </span>
                      <span className="hx-text-primary" style={{ fontWeight: 500, fontSize: 13 }}>
                        {entry.actor_name}
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className={`hx-badge ${entry.action === "create" ? "hx-badge-green" : "hx-badge-blue"}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="hx-text-tertiary" style={{ textAlign: "right", fontSize: 12 }}>
                    {timeAgo(entry.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
