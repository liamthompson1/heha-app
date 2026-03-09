"use client";

import type { InsurancePolicy } from "@/types/insurance";
import { formatDate as formatIsoDate } from "@/lib/format-date";

/** If the date is already human-readable (not ISO), return as-is */
function formatDate(date: string): string {
  if (/^\d{4}-\d{2}/.test(date)) return formatIsoDate(date);
  return date;
}

const STATUS_COLORS: Record<InsurancePolicy["status"], string> = {
  active: "var(--teal)",
  pending: "var(--gold)",
  expired: "var(--text-tertiary)",
  claimed: "var(--coral)",
};

const TYPE_LABELS: Record<InsurancePolicy["type"], string> = {
  annual: "Annual",
  comprehensive: "Single Trip",
  medical: "Medical",
  cancellation: "Cancellation",
};

interface PolicyCardProps {
  policy: InsurancePolicy;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
  const statusColor = STATUS_COLORS[policy.status];

  return (
    <div className="insurance-policy-card">
      <div className="insurance-policy-header">
        <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🛡️</span>

        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {policy.name}
            </span>
            <span
              className="insurance-status-badge"
              style={{ background: `${statusColor}20`, color: statusColor }}
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
              className="glass-button glass-button-teal glass-button-sm"
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
