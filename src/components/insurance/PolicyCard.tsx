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
    label: "Gold Cover",
    icon: "👑",
    className: "policy-card-gold",
  },
  silver: {
    label: "Silver Cover",
    icon: "🥈",
    className: "policy-card-silver",
  },
  bronze: {
    label: "Bronze Cover",
    icon: "🥉",
    className: "policy-card-bronze",
  },
} as const;

interface PolicyCardProps {
  policy: InsurancePolicy;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
  const tierConfig = policy.tier ? TIER_CONFIG[policy.tier] : null;

  return (
    <div className={`insurance-policy-card ${tierConfig?.className ?? ""}`}>
      {/* Tier badge */}
      {tierConfig && (
        <div className="policy-tier-badge">
          <span>{tierConfig.icon}</span>
          <span>{tierConfig.label}</span>
        </div>
      )}

      <div className="insurance-policy-header">
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: tierConfig ? "var(--text-primary)" : "var(--text-primary)",
              }}
            >
              {policy.name}
            </span>
            <span
              className="insurance-status-badge"
              style={
                policy.status === "active" && tierConfig
                  ? { background: "rgba(46, 205, 193, 0.15)", color: "var(--teal)" }
                  : { background: "rgba(46, 205, 193, 0.12)", color: "var(--teal)" }
              }
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
          <div
            className="mt-1"
            style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
          >
            {policy.provider} &middot; {policy.policy_number}
          </div>
          {policy.destination && (
            <div
              className="mt-1"
              style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}
            >
              {policy.destination}
            </div>
          )}
          <div
            className="mt-1"
            style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}
          >
            {formatDate(policy.start_date)} — {formatDate(policy.end_date)}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {policy.links && (
        <div className="insurance-policy-actions">
          {policy.links.view && (
            <a
              href={policy.links.view}
              target="_blank"
              rel="noopener noreferrer"
              className={`glass-button glass-button-sm ${tierConfig ? "policy-action-gold" : "glass-button-teal"}`}
            >
              View Policy
            </a>
          )}
          {policy.links.amend && (
            <a
              href={policy.links.amend}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button glass-button-sm"
            >
              Amend Policy
            </a>
          )}
        </div>
      )}
    </div>
  );
}
