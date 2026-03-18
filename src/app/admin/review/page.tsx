"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
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
      <div style={{ marginBottom: 40 }}>
        <p className="hx-eyebrow" style={{ marginBottom: 8 }}>
          Moderation
        </p>
        <h1 className="hx-heading" style={{ fontSize: 48 }}>
          Review Queue
        </h1>
      </div>

      {loading ? (
        <div
          className="hx-glass hx-text-tertiary"
          style={{ padding: "48px 24px", textAlign: "center" }}
        >
          Loading...
        </div>
      ) : pending.length === 0 ? (
        <div
          className="hx-glass"
          style={{ padding: "64px 24px", textAlign: "center" }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <p
            className="hx-text-primary"
            style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}
          >
            All clear
          </p>
          <p className="hx-text-tertiary" style={{ fontSize: 14 }}>
            No content pending review.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pending.map((d) => (
            <div key={d.id} className="hx-glass" style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    className="hx-text-primary"
                    style={{ fontSize: 16, fontWeight: 600 }}
                  >
                    {d.name}
                  </div>
                  <div
                    className="hx-text-tertiary"
                    style={{ fontSize: 12, marginTop: 2 }}
                  >
                    {d.country} · by {d.updated_by_name || "unknown"} ·{" "}
                    {new Date(d.updated_at).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="hx-btn-secondary hx-btn-sm"
                    onClick={() =>
                      setExpanded(expanded === d.id ? null : d.id)
                    }
                  >
                    {expanded === d.id ? "Collapse" : "Preview"}
                  </button>
                  <button className="hx-btn-primary hx-btn-green hx-btn-sm">
                    Approve
                  </button>
                  <button className="hx-btn-primary hx-btn-red hx-btn-sm">
                    Reject
                  </button>
                </div>
              </div>
              {expanded === d.id && (
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: "0.5px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="glass-prose"
                    style={{ maxHeight: 400, overflow: "auto" }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {d.content_markdown}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
