import type { TimelineStep, TimelineStepStatus } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface TimelineCardProps {
  steps: TimelineStep[];
  delay?: number;
}

function StepDot({ status }: { status: TimelineStepStatus }) {
  switch (status) {
    case "completed":
      return <div className="h-3 w-3 rounded-full bg-emerald-400 shrink-0" />;
    case "current":
      return (
        <div className="relative h-3 w-3 shrink-0">
          <div className="absolute inset-0 rounded-full bg-blue-400" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
          <div className="absolute inset-0 rounded-full bg-blue-400" />
        </div>
      );
    case "upcoming":
      return <div className="h-3 w-3 rounded-full border border-white/30 shrink-0" />;
  }
}

export function TimelineCard({ steps, delay }: TimelineCardProps) {
  return (
    <SectionCard title="Your Journey" accentColor="var(--gold)" delay={delay}>
      <div className="relative">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <StepDot status={step.status} />
                {!isLast && <div className="w-px flex-1 min-h-[24px] bg-white/10 my-1" />}
              </div>
              <div className={`-mt-0.5 ${isLast ? "pb-0" : "pb-4"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/40 tabular-nums w-11">{step.time}</span>
                  <span className={`text-sm ${step.status === "upcoming" ? "text-white/60" : "text-white/90"}`}>
                    {step.label}
                  </span>
                  {step.durationMinutes && (
                    <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-0.5 text-[10px] text-blue-300/70">
                      Est. ~{step.durationMinutes} min wait
                    </span>
                  )}
                </div>
                {step.note && <p className="mt-0.5 ml-14 text-xs text-white/35">{step.note}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
