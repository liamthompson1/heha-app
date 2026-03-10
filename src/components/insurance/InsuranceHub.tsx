"use client";

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
  // Build InsurancePolicy[] from parsed data
  const policies: InsurancePolicy[] = (insuranceData?.policies ?? []).map((p) => ({
    id: p.bookingRef,
    type: p.policyType === "annual" ? "annual" : "comprehensive",
    name: p.headingName || (p.policyType === "annual" ? "Annual Travel Insurance" : "Single Trip Insurance"),
    status: "active",
    provider: "Holiday Extras",
    policy_number: p.bookingRef,
    coverage_amount: 0,
    excess: 0,
    start_date: p.startDate,
    end_date: p.endDate,
    benefits: [],
    documents: [],
    links: p.links,
    destination: p.destination,
    tier: p.tier,
  }));

  const purchaseOption = insuranceData?.purchaseOption ?? null;

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-16" style={{ width: "100%", overflowX: "hidden" }}>
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
          ) : purchaseOption ? (
            <a
              href={purchaseOption.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel"
              style={{
                display: "block",
                padding: "32px 24px",
                borderRadius: "var(--glass-radius)",
                textAlign: "center",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "2rem", display: "block", marginBottom: 12 }}>{"\u{1F6E1}\uFE0F"}</span>
              <p style={{ color: "var(--text-primary)", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 6px 0" }}>
                Get Travel Insurance
                {purchaseOption.price ? ` from ${purchaseOption.currency === "GBP" ? "\u00A3" : purchaseOption.currency}${purchaseOption.price}` : ""}
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                Protect your {trip.trip.destination || "trip"} holiday with Holiday Extras
              </p>
            </a>
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

      {/* Document Vault */}
      <ScrollReveal delay={200}>
        <div className="widget-section">
          <div className="widget-header">
            <span style={{ fontSize: "1.25rem" }}>{"\u{1F5C2}\uFE0F"}</span>
            <h2 className="widget-title">Document Vault</h2>
          </div>
          <DocumentVault tripId={trip.id} />
        </div>
      </ScrollReveal>

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
