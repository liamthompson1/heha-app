"use client";

import { useEffect, useState } from "react";
import type { SinglePerilProduct, PricingPlan } from "@/types/single-peril";
import { GENERAL_PRODUCTS, TRIP_SPECIFIC_PRODUCTS, PRODUCT_BOOKING_MAP } from "@/types/single-peril";

interface SinglePerilGridProps {
  /** Only show general products (insurance page) or trip-specific (trip page) */
  filter: "general" | "trip-specific";
  /** Booking product types from the trip, used to filter trip-specific products */
  bookingTypes?: string[];
  /** Product IDs that the user has already added */
  addedProductIds?: Set<string>;
}

function formatPrice(plan: PricingPlan): string {
  const symbol = plan.currency === "GBP" ? "£" : plan.currency;
  if (plan.price_min === plan.price_max) {
    return `${symbol}${plan.price_min}`;
  }
  return `from ${symbol}${plan.price_min}`;
}

function formatPeriod(period: string): string {
  if (period === "daily") return "/day";
  if (period === "annual") return "/year";
  if (period === "trip") return "/trip";
  if (period === "ticket") return "/ticket";
  return `/${period}`;
}

export default function SinglePerilGrid({ filter, bookingTypes = [], addedProductIds = new Set() }: SinglePerilGridProps) {
  const [products, setProducts] = useState<SinglePerilProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/insurance-products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products ?? []);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="sp-grid">
        {[1, 2].map((i) => (
          <div key={i} className="sp-card glass-panel animate-pulse">
            <div style={{ height: 100, background: "rgba(255,255,255,0.03)", borderRadius: 12 }} />
            <div style={{ height: 16, width: "60%", background: "rgba(255,255,255,0.06)", borderRadius: 8, marginTop: 12 }} />
            <div style={{ height: 12, width: "80%", background: "rgba(255,255,255,0.04)", borderRadius: 6, marginTop: 8 }} />
          </div>
        ))}
      </div>
    );
  }

  // Filter products based on mode
  const lowerBookings = bookingTypes.map((b) => b.toLowerCase());
  const filtered = products.filter((p) => {
    if (filter === "general") {
      return GENERAL_PRODUCTS.has(p.id);
    }
    // Trip-specific: only show if matching booking exists
    if (TRIP_SPECIFIC_PRODUCTS.has(p.id)) {
      const matchTerms = PRODUCT_BOOKING_MAP[p.id] ?? [];
      return matchTerms.some((term) =>
        lowerBookings.some((b) => b.includes(term))
      );
    }
    return false;
  });

  if (filtered.length === 0) return null;

  return (
    <div className="sp-grid">
      {filtered.map((product) => {
        const isAdded = addedProductIds.has(product.id);
        const isExpanded = expanded === product.id;
        const cheapestPlan = product.pricing_plans.reduce<PricingPlan | null>(
          (best, plan) => (!best || plan.price_min < best.price_min ? plan : best),
          null
        );

        return (
          <div
            key={product.id}
            className={`sp-card glass-panel ${isAdded ? "sp-card-added" : ""} ${isExpanded ? "sp-card-expanded" : ""}`}
            onClick={() => setExpanded(isExpanded ? null : product.id)}
          >
            {/* Image */}
            {product.image_url && (
              <div className="sp-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image_url} alt={product.name} />
                {isAdded && (
                  <div className="sp-added-badge">✓ Added</div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="sp-card-body">
              <div className="sp-card-top">
                <h3 className="sp-card-title">{product.name}</h3>
                {cheapestPlan && (
                  <div className="sp-card-price">
                    <span className="sp-price-amount">{formatPrice(cheapestPlan)}</span>
                    <span className="sp-price-period">{formatPeriod(cheapestPlan.price_period)}</span>
                  </div>
                )}
              </div>

              <p className="sp-card-desc">{product.description}</p>

              {/* Coverage features */}
              {isExpanded && (
                <div className="sp-card-details">
                  <div className="sp-section-label">Coverage</div>
                  {product.coverage_features.map((f, i) => (
                    <div key={i} className="sp-feature">
                      <div className="sp-feature-name">{f.feature_name}</div>
                      <div className="sp-feature-detail">{f.detail}</div>
                      <div className="sp-feature-limit">
                        Up to {f.unit === "GBP" ? "£" : f.unit}{f.limit_amount.toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {/* Pricing plans */}
                  <div className="sp-section-label" style={{ marginTop: 16 }}>Plans</div>
                  <div className="sp-plans">
                    {product.pricing_plans.map((plan, i) => (
                      <div key={i} className="sp-plan">
                        <div className="sp-plan-name">{plan.plan_name}</div>
                        <div className="sp-plan-price">
                          {plan.currency === "GBP" ? "£" : plan.currency}
                          {plan.price_min}
                          {plan.price_min !== plan.price_max ? ` – £${plan.price_max}` : ""}
                          {formatPeriod(plan.price_period)}
                        </div>
                        <div className="sp-plan-cond">{plan.conditions}</div>
                      </div>
                    ))}
                  </div>

                  {/* Applicable trip types */}
                  {product.applicable_trip_types.length > 0 && (
                    <>
                      <div className="sp-section-label" style={{ marginTop: 16 }}>Great for</div>
                      <div className="sp-trip-types">
                        {product.applicable_trip_types.map((t, i) => (
                          <span key={i} className="sp-trip-tag">{t.trip_type.replace(/_/g, " ")}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="sp-card-footer">
                <span className="sp-expand-hint">
                  {isExpanded ? "Tap to collapse" : "Tap for details"}
                </span>
                {!isAdded && (
                  <button
                    className="sp-add-btn"
                    onClick={(e) => { e.stopPropagation(); /* future: add product */ }}
                  >
                    Get covered
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
