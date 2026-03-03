"use client";

import { useState } from "react";
import type { LocalTip, FoodSpot } from "@/types/trip-content";

interface LocalKnowledgeWidgetProps {
  tips: LocalTip[];
  foodSpots: FoodSpot[];
}

const categoryIcons: Record<string, string> = {
  transport: "🚇",
  etiquette: "🤝",
  safety: "🛡",
  money: "💰",
  language: "🗣",
  general: "💡",
};

const priceColors: Record<string, string> = {
  "$": "var(--teal)",
  "$$": "var(--blue)",
  "$$$": "var(--purple)",
  "$$$$": "var(--gold)",
};

export default function LocalKnowledgeWidget({ tips, foodSpots }: LocalKnowledgeWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const hasTips = tips.length > 0;
  const hasFood = foodSpots.length > 0;

  if (!hasTips && !hasFood) return null;

  const visibleTips = expanded ? tips : tips.slice(0, 4);
  const canExpand = tips.length > 4;

  return (
    <>
      {hasTips && (
        <div className="widget-section">
          <div className="widget-header">
            <span style={{ fontSize: "1.25rem" }}>🧠</span>
            <h2 className="widget-title">Local Knowledge</h2>
          </div>

          <div className="space-y-3">
            {visibleTips.map((tip, i) => (
              <div key={i} className="local-tip-card glass-panel">
                <span className="local-tip-icon">
                  {categoryIcons[tip.category] || "💡"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {tip.title}
                  </p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {tip.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {canExpand && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-sm font-medium"
              style={{ color: "var(--blue)" }}
            >
              {expanded ? "Show less" : `Show all ${tips.length} tips`}
            </button>
          )}
        </div>
      )}

      {hasFood && (
        <div className="widget-section">
          <div className="widget-header">
            <span style={{ fontSize: "1.25rem" }}>🍽</span>
            <h2 className="widget-title">Food & Drink</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {foodSpots.map((spot, i) => (
              <div key={i} className="glass-panel food-spot-card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {spot.name}
                    </h3>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {spot.type}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold flex-shrink-0"
                    style={{ color: priceColors[spot.price_range] || "var(--text-secondary)" }}
                  >
                    {spot.price_range}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {spot.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
