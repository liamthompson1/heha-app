"use client";

import { useState } from "react";
import type { InsurancePolicy } from "@/types/insurance";
import { formatDate } from "@/lib/format-date";
import GlassButton from "@/components/GlassButton";

const STATUS_COLORS: Record<InsurancePolicy["status"], string> = {
  active: "var(--teal)",
  pending: "var(--gold)",
  expired: "var(--text-tertiary)",
  claimed: "var(--coral)",
};

const currencyFmt = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

interface PolicyCardProps {
  policy: InsurancePolicy;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[policy.status];

  return (
    <div className="insurance-policy-card">
      <button
        className="insurance-policy-header"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
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
          </div>
          <div
            className="mt-1"
            style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
          >
            {policy.provider} &middot; {policy.policy_number}
          </div>
          <div
            className="mt-1"
            style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}
          >
            {formatDate(policy.start_date)} — {formatDate(policy.end_date)}
          </div>
        </div>

        <span
          className="insurance-expand-icon"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="insurance-policy-details">
          {policy.coverage_amount > 0 && (
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--teal)",
                marginBottom: 16,
              }}
            >
              {currencyFmt.format(policy.coverage_amount / 100)}
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 400,
                  color: "var(--text-tertiary)",
                  marginLeft: 8,
                }}
              >
                total cover
              </span>
            </div>
          )}

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0" }}>
            {policy.benefits.map((b, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 0",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                }}
              >
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>

          {policy.excess > 0 && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-tertiary)",
                marginBottom: 20,
              }}
            >
              Excess: {currencyFmt.format(policy.excess / 100)}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <GlassButton variant="teal" size="sm" onClick={() => {}}>
              View Policy
            </GlassButton>
            <GlassButton variant="ghost" size="sm" onClick={() => {}}>
              Download Certificate
            </GlassButton>
          </div>
        </div>
      )}
    </div>
  );
}
