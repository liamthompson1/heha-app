"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/admin/StatCard";
import { fetchAdminStats, fetchContentHistory } from "@/lib/api/destinations";
import type { AdminStats, ContentHistoryEntry } from "@/types/destination";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [history, setHistory] = useState<ContentHistoryEntry[]>([]);

  useEffect(() => {
    fetchAdminStats().then(setStats);
    fetchContentHistory().then(setHistory);
  }, []);

  return (
    <AdminShell>
      <div style={{ marginBottom: 40 }}>
        <p className="hx-eyebrow" style={{ marginBottom: 8 }}>
          Admin
        </p>
        <h1 className="hx-heading" style={{ fontSize: 48 }}>
          Dashboard
        </h1>
      </div>

      {/* Stats */}
      {stats ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 48,
          }}
        >
          <StatCard
            label="Total Destinations"
            value={stats.total_destinations}
            icon="🌍"
            color="#0a84ff"
          />
          <StatCard
            label="Published"
            value={stats.published_destinations}
            icon="✓"
            color="#30d158"
          />
          <StatCard
            label="Active Bots"
            value={stats.active_bots}
            icon="🤖"
            color="#bf5af2"
          />
          <StatCard
            label="Pending Reviews"
            value={stats.pending_reviews}
            icon="📝"
            color={stats.pending_reviews > 0 ? "#ff453a" : "#ff9f0a"}
          />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 48,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="hx-glass"
              style={{ height: 140, opacity: 0.5 }}
            />
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <h2
        className="hx-text-primary"
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: 16,
        }}
      >
        Recent Activity
      </h2>

      <div className="hx-glass hx-table-wrap" style={{ padding: 0 }}>
        <table className="hx-table">
          <thead>
            <tr>
              <th>Actor</th>
              <th>Action</th>
              <th>Destination</th>
              <th style={{ textAlign: "right" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", padding: "32px 16px" }}
                >
                  No activity yet.
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
                    <span
                      className={`hx-badge ${entry.action === "create" ? "hx-badge-green" : "hx-badge-blue"}`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td style={{ color: "#0a84ff", fontWeight: 500, fontSize: 13 }}>
                    {entry.destination_slug}
                  </td>
                  <td
                    className="hx-text-tertiary"
                    style={{ textAlign: "right", fontSize: 12 }}
                  >
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
