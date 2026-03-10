"use client";

import type { InsurancePolicy } from "@/types/insurance";
import { formatDate as formatIsoDate } from "@/lib/format-date";

/** If the date is already human-readable (not ISO), return as-is */
function formatDate(date: string): string {
  if (/^\d{4}-\d{2}/.test(date)) return formatIsoDate(date);
  return date;
}

const TYPE_LABELS: Record<InsurancePolicy["type"], string> = {
  annual: "Annual",
  comprehensive: "Single Trip",
  medical: "Medical",
  cancellation: "Cancellation",
};

const TIER_CONFIG = {
  gold: {
    label: "Gold",
    icon: "👑",
    className: "policy-card-gold",
  },
  silver: {
    label: "Silver",
    icon: "🥈",
    className: "policy-card-silver",
  },
  bronze: {
    label: "Bronze",
    icon: "🥉",
    className: "policy-card-bronze",
  },
} as const;

interface PolicyCardProps {
  policy: InsurancePolicy;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
  const tierConfig = policy.tier ? TIER_CONFIG[policy.tier] : null;
  const isGold = policy.tier === "gold";
  const goldText = isGold ? "rgba(255, 215, 0, 0.65)" : undefined;

  if (tierConfig) {
    return (
      <div className={`insurance-policy-card ${tierConfig.className}`}>
        {/* Top row: tier badge + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="policy-tier-badge">
            <span>{tierConfig.icon}</span>
            <span>{tierConfig.label}</span>
          </div>
          <span
            className="insurance-status-badge"
            style={
              isGold
                ? { background: "rgba(255, 215, 0, 0.12)", color: "#ffd700", fontSize: "0.68rem" }
                : { background: "rgba(46, 205, 193, 0.12)", color: "var(--teal)", fontSize: "0.68rem" }
            }
          >
            {policy.status}
          </span>
        </div>

        {/* Middle: policy name + details */}
        <div>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            {policy.name}
          </div>
          <div style={{ fontSize: "0.8rem", color: goldText ?? "var(--text-secondary)" }}>
            {policy.provider} &middot; {policy.policy_number}
          </div>
          {policy.destination && (
            <div style={{ fontSize: "0.75rem", color: goldText ?? "var(--text-tertiary)", marginTop: 2 }}>
              {policy.destination}
            </div>
          )}
        </div>

        {/* Bottom row: dates + actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: "0.75rem", color: goldText ?? "var(--text-tertiary)" }}>
            {formatDate(policy.start_date)} — {formatDate(policy.end_date)}
          </div>
          {policy.links && (
            <div style={{ display: "flex", gap: 8 }}>
              {policy.links.view && (
                <a
                  href={policy.links.view}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="policy-action-gold"
                  style={{ fontSize: "0.75rem", fontWeight: 600, padding: "5px 14px", borderRadius: 100, textDecoration: "none" }}
                >
                  View
                </a>
              )}
              {policy.links.amend && (
                <a
                  href={policy.links.amend}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="policy-action-gold"
                  style={{ fontSize: "0.75rem", fontWeight: 600, padding: "5px 14px", borderRadius: 100, textDecoration: "none" }}
                >
                  Amend
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default non-tiered card
  return (
    <div className="insurance-policy-card">
      <div className="insurance-policy-header">
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {policy.name}
            </span>
            <span
              className="insurance-status-badge"
              style={{ background: "rgba(46, 205, 193, 0.12)", color: "var(--teal)" }}
            >
              {policy.status}
            </span>
            <span
              className="insurance-status-badge"
              style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}
            >
              {TYPE_LABELS[policy.type] ?? policy.type}
            </span>
          </div>
          <div className="mt-1" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {policy.provider} &middot; {policy.policy_number}
          </div>
          {policy.destination && (
            <div className="mt-1" style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
              {policy.destination}
            </div>
          )}
          <div className="mt-1" style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
            {formatDate(policy.start_date)} — {formatDate(policy.end_date)}
          </div>
        </div>
      </div>
      {policy.links && (
        <div className="insurance-policy-actions">
          {policy.links.view && (
            <a href={policy.links.view} target="_blank" rel="noopener noreferrer" className="glass-button glass-button-teal glass-button-sm">
              View Policy
            </a>
          )}
          {policy.links.amend && (
            <a href={policy.links.amend} target="_blank" rel="noopener noreferrer" className="glass-button glass-button-sm">
              Amend Policy
            </a>
          )}
        </div>
      )}
    </div>
  );
}
