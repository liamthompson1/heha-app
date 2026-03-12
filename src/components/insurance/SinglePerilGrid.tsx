"use client";

import { useEffect, useState, useCallback } from "react";
import type { SinglePerilProduct, PricingPlan } from "@/types/single-peril";
import { GENERAL_PRODUCTS, TRIP_SPECIFIC_PRODUCTS, PRODUCT_BOOKING_MAP } from "@/types/single-peril";

interface SinglePerilGridProps {
  filter: "general" | "trip-specific";
  tripId: string;
  bookingTypes?: string[];
}

function formatPrice(plan: PricingPlan): string {
  const symbol = plan.currency === "GBP" ? "£" : plan.currency;
  return `from ${symbol}${plan.price_min}`;
}

function formatPeriod(period: string): string {
  if (period === "daily") return "/day";
  if (period === "annual") return "/year";
  if (period === "trip") return "/trip";
  if (period === "ticket") return "/ticket";
  return `/${period}`;
}

export default function SinglePerilGrid({ filter, tripId, bookingTypes = [] }: SinglePerilGridProps) {
  const [products, setProducts] = useState<SinglePerilProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch products + selected perils
  useEffect(() => {
    (async () => {
      try {
        const [prodRes, perilRes] = await Promise.all([
          fetch("/api/insurance-products"),
          fetch(`/api/trips/${tripId}/perils`),
        ]);
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProducts(data.products ?? []);
        }
        if (perilRes.ok) {
          const data = await perilRes.json();
          setAddedIds(new Set(data.selected_perils ?? []));
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  const togglePeril = useCallback(async (productId: string) => {
    const isAdded = addedIds.has(productId);
    const action = isAdded ? "remove" : "add";

    // Optimistic update
    setTogglingId(productId);
    setAddedIds((prev) => {
      const next = new Set(prev);
      if (isAdded) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const res = await fetch(`/api/trips/${tripId}/perils`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, action }),
      });
      if (res.ok) {
        const data = await res.json();
        setAddedIds(new Set(data.selected_perils ?? []));
      }
    } catch {
      // Revert on error
      setAddedIds((prev) => {
        const next = new Set(prev);
        if (isAdded) next.add(productId);
        else next.delete(productId);
        return next;
      });
    } finally {
      setTogglingId(null);
    }
  }, [tripId, addedIds]);

  if (loading) {
    return (
      <div className="sp-grid">
        {[1, 2].map((i) => (
          <div key={i} className="sp-card glass-panel animate-pulse">
            <div style={{ height: 90, background: "rgba(255,255,255,0.03)", borderRadius: "var(--glass-radius-sm) var(--glass-radius-sm) 0 0" }} />
            <div style={{ padding: 14 }}>
              <div style={{ height: 14, width: "60%", background: "rgba(255,255,255,0.06)", borderRadius: 6 }} />
              <div style={{ height: 10, width: "80%", background: "rgba(255,255,255,0.04)", borderRadius: 4, marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const lowerBookings = bookingTypes.map((b) => b.toLowerCase());
  const filtered = products.filter((p) => {
    if (filter === "general") return GENERAL_PRODUCTS.has(p.id);
    if (TRIP_SPECIFIC_PRODUCTS.has(p.id)) {
      const matchTerms = PRODUCT_BOOKING_MAP[p.id] ?? [];
      return matchTerms.some((term) => lowerBookings.some((b) => b.includes(term)));
    }
    return false;
  });

  if (filtered.length === 0) return null;

  return (
    <div className="sp-grid">
      {filtered.map((product) => {
        const isAdded = addedIds.has(product.id);
        const isToggling = togglingId === product.id;
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
            {product.image_url && (
              <div className="sp-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image_url} alt={product.name} />
                {isAdded && <div className="sp-added-badge">✓ Covered</div>}
              </div>
            )}

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
                <button
                  className={isAdded ? "sp-remove-btn" : "sp-add-btn"}
                  disabled={isToggling}
                  onClick={(e) => { e.stopPropagation(); togglePeril(product.id); }}
                >
                  {isToggling ? "…" : isAdded ? "✓ Covered" : "Get covered"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
