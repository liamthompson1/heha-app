"use client";

import { useState } from "react";
import type { TripRow } from "@/types/trip";
import type { InsurancePolicy } from "@/types/insurance";
import type { ParsedInsuranceData } from "@/lib/insurance-parser";
import ScrollReveal from "@/components/ScrollReveal";
import GlassButton from "@/components/GlassButton";
import PolicyCard from "./PolicyCard";
import DocumentVault from "./DocumentVault";

interface InsuranceHubProps {
  trip: TripRow;
  insuranceData?: ParsedInsuranceData | null;
}

export default function InsuranceHub({ trip, insuranceData }: InsuranceHubProps) {
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Build policy from parsed data
  const policies: InsurancePolicy[] = insuranceData
    ? [
        {
          id: "stories-policy",
          type: "comprehensive",
          name: insuranceData.policyName,
          status: "active",
          provider: insuranceData.provider,
          policy_number: insuranceData.policyNumber ?? "\u2014",
          coverage_amount: 0,
          excess: 0,
          start_date: trip.trip.start_date,
          end_date: trip.trip.end_date,
          benefits: insuranceData.benefits,
          documents: [],
        },
      ]
    : [];

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-16">
      {/* Coverage Summary Cards */}
      {insuranceData && insuranceData.benefits.length > 0 && (
        <ScrollReveal>
          <div className="insurance-summary-row">
            {insuranceData.benefits.map((b, i) => (
              <div key={i} className="insurance-summary-card glass-panel">
                <span style={{ fontSize: "1.5rem" }}>{b.icon}</span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginTop: 6,
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {b.text}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}

      {/* Active Policies */}
      <ScrollReveal delay={100}>
        <div className="widget-section">
          <div className="widget-header">
            <span style={{ fontSize: "1.25rem" }}>{"\u{1F4DC}"}</span>
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
              <span style={{ fontSize: "2rem", display: "block", marginBottom: 12 }}>{"\u{1F512}"}</span>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>
                No active policies yet
              </p>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Full Details — raw HTML from stories */}
      {insuranceData?.rawHtml && (
        <ScrollReveal delay={150}>
          <div className="widget-section">
            <button
              onClick={() => setShowFullDetails((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "0.95rem",
                padding: 0,
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{"\u{1F4C3}"}</span>
              Full Details
              <span
                style={{
                  transition: "transform 0.3s var(--ease-spring)",
                  transform: showFullDetails ? "rotate(180deg)" : "rotate(0deg)",
                  color: "var(--text-tertiary)",
                }}
              >
                {"\u25BE"}
              </span>
            </button>

            {showFullDetails && (
              <div
                className="insurance-full-details stories-html-content"
                dangerouslySetInnerHTML={{ __html: insuranceData.rawHtml }}
              />
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Document Vault */}
      <ScrollReveal delay={200}>
        <div className="widget-section">
          <div className="widget-header">
            <span style={{ fontSize: "1.25rem" }}>{"\u{1F5C2}\uFE0F"}</span>
            <h2 className="widget-title">Document Vault</h2>
          </div>
          <DocumentVault documents={[]} />
        </div>
      </ScrollReveal>

      {/* Quick Actions */}
      {insuranceData && (
        <ScrollReveal delay={250}>
          <div className="insurance-actions-row">
            <GlassButton variant="teal" size="sm" onClick={() => {}}>
              View Policy
            </GlassButton>
            <GlassButton variant="ghost" size="sm" onClick={() => {}}>
              Download Certificate
            </GlassButton>
            <GlassButton variant="ghost" size="sm" onClick={() => {}}>
              Make a Claim
            </GlassButton>
          </div>
        </ScrollReveal>
      )}

      {/* Help Footer */}
      <ScrollReveal delay={300}>
        <div className="insurance-help-footer">
          <span style={{ fontSize: "1.5rem", marginBottom: 8, display: "block" }}>{"\u{1F4AC}"}</span>
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
