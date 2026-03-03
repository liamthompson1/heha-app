import type { OnTimeStats } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface OnTimeCardProps {
  stats: OnTimeStats;
  delay?: number;
}

const rows = [
  { key: "early", label: "Early", field: "earlyPercent", color: "bg-emerald-400" },
  { key: "ontime", label: "On time", field: "onTimePercent", color: "bg-emerald-400" },
  { key: "late1", label: "Late < 1 hr", field: "lateUnder1hrPercent", color: "bg-amber-400" },
  { key: "late2", label: "Late > 1 hr", field: "lateOver1hrPercent", color: "bg-red-400" },
  { key: "cancelled", label: "Cancelled", field: "cancelledPercent", color: "bg-red-400" },
] as const;

export function OnTimeCard({ stats, delay }: OnTimeCardProps) {
  const { breakdown } = stats;

  return (
    <SectionCard title="Arrival Forecast" accentColor="var(--gold)" delay={delay}>
      {/* Horizontal bar chart */}
      <div className="space-y-2.5">
        {rows.map(({ key, label, field, color }) => {
          const value = breakdown[field];
          const barWidth = value;

          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-white/50 text-right">{label}</span>
              <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                {value > 0 && (
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${barWidth}%` }} />
                )}
              </div>
              <span className="w-10 shrink-0 text-xs tabular-nums text-white/70 text-right">{value}%</span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-white/60">
        {stats.onTimePercentage}% chance of arriving on time · When late, avg delay is{" "}
        <span className="font-medium text-white/80">{stats.avgDelayMinutesWhenLate} min</span>
      </p>
      <p className="mt-1 text-xs text-white/40">
        Last {stats.periodDays} days ({stats.sampleSize} flights)
      </p>
    </SectionCard>
  );
}
