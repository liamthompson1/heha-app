import type { GateInfo, FlightStatus } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface GateInfoCardProps {
  gateInfo: GateInfo;
  delay?: number;
}

const statusConfig: Record<FlightStatus, { label: string; dotColor: string; textColor: string }> = {
  "on-time": { label: "On Time", dotColor: "bg-emerald-400", textColor: "text-emerald-400" },
  delayed: { label: "Delayed", dotColor: "bg-amber-400", textColor: "text-amber-400" },
  cancelled: { label: "Cancelled", dotColor: "bg-red-400", textColor: "text-red-400" },
};

function TbdShimmer() {
  return <span className="shimmer-text font-medium">TBD</span>;
}

export function GateInfoCard({ gateInfo, delay }: GateInfoCardProps) {
  const status = statusConfig[gateInfo.flightStatus];

  return (
    <SectionCard title="Gate & Arrival Info" accentColor="var(--blue)" delay={delay}>
      <div className="mb-4">
        <span className={`inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm ${status.textColor}`}>
          <span className={`h-2 w-2 rounded-full ${status.dotColor}`} style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
          {status.label}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Departure gate</span>
          {gateInfo.departureGate ? (
            <span className="text-sm font-medium text-white/90">{gateInfo.departureGate}</span>
          ) : (
            <TbdShimmer />
          )}
        </div>
        {!gateInfo.departureGate && gateInfo.departureGateNote && (
          <p className="text-xs text-white/40 text-right -mt-1">{gateInfo.departureGateNote}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Arrival terminal</span>
          <span className="text-sm font-medium text-white/90">
            {gateInfo.arrivalTerminal ?? <TbdShimmer />}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Baggage carousel</span>
          {gateInfo.baggageCarousel ? (
            <span className="text-sm font-medium text-white/90">{gateInfo.baggageCarousel}</span>
          ) : (
            <TbdShimmer />
          )}
        </div>
        {!gateInfo.baggageCarousel && gateInfo.baggageNote && (
          <p className="text-xs text-white/40 text-right -mt-1">{gateInfo.baggageNote}</p>
        )}
      </div>
    </SectionCard>
  );
}
