"use client";

import type { ThingToDo } from "@/types/trip-content";

interface ThingsToDoWidgetProps {
  things: ThingToDo[];
}

const categoryColors: Record<string, string> = {
  culture: "var(--purple)",
  nature: "var(--teal)",
  food: "var(--coral)",
  nightlife: "var(--purple)",
  adventure: "var(--blue)",
  shopping: "var(--gold)",
};

export default function ThingsToDoWidget({ things }: ThingsToDoWidgetProps) {
  if (things.length === 0) return null;

  return (
    <div className="widget-section">
      <div className="widget-header">
        <span style={{ fontSize: "1.25rem" }}>🗺</span>
        <h2 className="widget-title">Things to Do</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {things.map((thing, i) => {
          const accentColor = categoryColors[thing.category] || "var(--blue)";
          return (
            <div key={i} className="things-card glass-panel">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {thing.name}
                </h3>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    color: accentColor,
                    background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                  }}
                >
                  {thing.category}
                </span>
              </div>

              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                {thing.description}
              </p>

              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
                {thing.estimated_cost && <span>{thing.estimated_cost}</span>}
                {thing.duration && <span>⏱ {thing.duration}</span>}
              </div>

              {thing.insider_tip && (
                <div className="things-insider-tip">
                  <span className="text-xs font-medium" style={{ color: "var(--gold)" }}>
                    💡 Insider tip:
                  </span>
                  <span className="text-xs ml-1" style={{ color: "var(--text-secondary)" }}>
                    {thing.insider_tip}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
