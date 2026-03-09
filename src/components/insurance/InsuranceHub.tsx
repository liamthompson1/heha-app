"use client";

import type { TripRow } from "@/types/trip";
import { DUMMY_POLICIES, DUMMY_DOCUMENTS } from "@/types/insurance";
import { formatDateRange } from "@/lib/format-date";
import ScrollReveal from "@/components/ScrollReveal";
import GlassButton from "@/components/GlassButton";
import PolicyCard from "./PolicyCard";
import DocumentVault from "./DocumentVault";

interface InsuranceHubProps {
  trip: TripRow;
}

export default function InsuranceHub({ trip }: InsuranceHubProps) {
  const policies = DUMMY_POLICIES;
  const allDocs = DUMMY_DOCUMENTS;
  const dateRange = formatDateRange(trip.trip.start_date, trip.trip.end_date);

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-16">
      {/* Header */}
      <ScrollReveal>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: "1.75rem" }}>🛡️</span>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Insurance &amp; Protection
            </h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>
            {trip.trip.destination}
            {dateRange ? ` · ${dateRange}` : ""}
          </p>
        </div>
      </ScrollReveal>

      {/* Active Policies */}
      <ScrollReveal delay={100}>
        <div className="widget-section">
          <div className="widget-header">
            <span style={{ fontSize: "1.25rem" }}>📜</span>
            <h2 className="widget-title">Active Policies</h2>
          </div>

          {policies.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {policies.map((policy) => (
                <PolicyCard key={policy.id} policy={policy} />
              ))}
            </div>
          ) : (
            <div
              className="glass-panel"
              style={{
                padding: "40px 24px",
                borderRadius: "var(--glass-radius)",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "2rem", display: "block", marginBottom: 12 }}>🔒</span>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>
                No active policies yet
              </p>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Document Vault */}
      <ScrollReveal delay={200}>
        <div className="widget-section">
          <div className="widget-header">
            <span style={{ fontSize: "1.25rem" }}>🗂️</span>
            <h2 className="widget-title">Document Vault</h2>
          </div>
          <DocumentVault documents={allDocs} />
        </div>
      </ScrollReveal>

      {/* Help Footer */}
      <ScrollReveal delay={300}>
        <div className="insurance-help-footer">
          <span style={{ fontSize: "1.5rem", marginBottom: 8, display: "block" }}>💬</span>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              margin: "0 0 16px 0",
            }}
          >
            Questions about your coverage or need to make a claim?
          </p>
          <GlassButton variant="teal" size="sm" onClick={() => {}}>
            Get in touch
          </GlassButton>
        </div>
      </ScrollReveal>
    </div>
  );
}
