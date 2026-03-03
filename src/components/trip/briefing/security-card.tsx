import type { SecurityQueue } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface SecurityCardProps {
  queue: SecurityQueue;
  delay?: number;
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function SecurityCard({ queue, delay }: SecurityCardProps) {
  const maxWait = Math.max(...queue.hourlySlots.map((s) => s.estimatedWaitMinutes));
  const projectedHour = queue.projectedSlot.hour;

  return (
    <SectionCard title="Security Queue" accentColor="var(--blue)" delay={delay}>
      <div className="mb-4">
        <p className="text-sm text-white/50">
          Estimated wait at <span className="text-white/80">{formatHour(projectedHour)}</span>
        </p>
        <p className="text-3xl font-bold text-white/90 mt-1">
          {queue.projectedSlot.estimatedWaitMinutes}
          <span className="text-base font-normal text-white/50 ml-1">min</span>
        </p>
      </div>

      <div className="flex items-end gap-px h-16">
        {queue.hourlySlots.map((slot) => {
          const heightPct = maxWait > 0 ? (slot.estimatedWaitMinutes / maxWait) * 100 : 0;
          const isProjected = slot.hour === projectedHour;
          return (
            <div
              key={slot.hour}
              className="flex-1 rounded-t-sm transition-colors"
              style={{
                height: `${Math.max(heightPct, 4)}%`,
                backgroundColor: isProjected ? "var(--blue)" : "rgba(255, 255, 255, 0.12)",
              }}
              title={`${formatHour(slot.hour)}: ${slot.estimatedWaitMinutes} min`}
            />
          );
        })}
      </div>

      <div className="flex justify-between mt-1.5 text-[10px] text-white/30">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
      </div>

      <p className="mt-3 text-xs text-white/40">
        Based on {queue.arrivalBufferMinutes} min pre-departure arrival
      </p>
    </SectionCard>
  );
}
