"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/admin/StatCard";
import GlassCard from "@/components/GlassCard";
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [history, setHistory] = useState<ContentHistoryEntry[]>([]);

  useEffect(() => {
    fetchAdminStats().then(setStats);
    fetchContentHistory().then(setHistory);
  }, []);

  return (
    <AdminShell>
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
          Admin
        </p>
        <h1 className="gradient-text-subtle mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Dashboard
        </h1>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Destinations" value={stats.total_destinations} icon="🌍" color="#5AC8FA" />
          <StatCard label="Published" value={stats.published_destinations} icon="✓" color="#2ECDC1" />
          <StatCard label="Active Bots" value={stats.active_bots} icon="🤖" color="#8944E5" />
          <StatCard label="Pending Reviews" value={stats.pending_reviews} icon="📝" color={stats.pending_reviews > 0 ? "#FF6359" : "#F0B429"} />
        </div>
      ) : (
        <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel h-36 animate-pulse opacity-50" />
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <h2 className="mb-4 text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
        Recent Activity
      </h2>

      <GlassCard flush>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/6">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Actor</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Action</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Destination</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No activity yet.
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
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--blue)" }}>
                    {entry.destination_slug}
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
