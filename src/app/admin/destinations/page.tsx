"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import GlassCard from "@/components/GlassCard";
import { fetchDestinations } from "@/lib/api/destinations";
import type { Destination } from "@/types/destination";

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

const STATUS_LABEL: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  pending_review: "Pending",
};

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations().then((d) => {
      setDestinations(d);
      setLoading(false);
    });
  }, []);

  return (
    <AdminShell>
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
          Content
        </p>
        <h1 className="gradient-text-subtle mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Destinations
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          {destinations.length} destination{destinations.length !== 1 && "s"} managed by your bots.
        </p>
      </div>

      <GlassCard flush>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/6">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Destination</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Continent</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Updated By</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                  Loading...
                </td>
              </tr>
            ) : destinations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No destinations yet.
                </td>
              </tr>
            ) : (
              destinations.map((d) => (
                <tr key={d.id} className="border-b border-white/4 transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/destinations/${d.slug}`}
                      className="flex items-center gap-3 text-decoration-none"
                    >
                      {d.hero_image_url ? (
                        <img
                          src={d.hero_image_url}
                          alt={d.name}
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/4 text-lg">
                          🌍
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {d.name}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {d.country}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {d.continent}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={STATUS_BADGE[d.status]}>
                      {STATUS_LABEL[d.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {d.updated_by_name || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(d.updated_at).toLocaleDateString("en-GB")}
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
