import type { InboundFlight } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface InboundCardProps {
  inbound: InboundFlight;
  delay?: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function planePosition(status: InboundFlight["status"]): number {
  switch (status) {
    case "scheduled": return 10;
    case "en-route": return 50;
    case "landed": return 90;
  }
}

export function InboundCard({ inbound, delay }: InboundCardProps) {
  const arrivalTime = formatTime(inbound.scheduledArrival);
  const pos = planePosition(inbound.status);

  return (
    <SectionCard title="Where's My Plane?" accentColor="var(--coral)" delay={delay}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-white/80">
          <span className="font-mono font-medium">{inbound.flightNumber}</span>
          <span className="text-white/40 ml-2">{inbound.origin} → {inbound.destination}</span>
        </p>
        <span className="text-xs text-white/40">Arrives {arrivalTime}</span>
      </div>

      <p className="text-sm text-white/60 mb-4">{inbound.statusLabel}</p>

      <div className="relative h-8">
        <div className="absolute top-1/2 left-4 right-4 h-px bg-white/20 -translate-y-1/2" />
        <div className="absolute top-1/2 left-4 -translate-y-1/2 -translate-x-1/2">
          <span className="text-xs font-semibold text-white/60">{inbound.origin}</span>
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000"
          style={{ left: `calc(16px + (100% - 32px) * ${pos / 100})` }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L13 8H18L16 10L18 16H13L10 18L7 16H2L4 10L2 8H7L10 2Z" fill="var(--coral)" opacity="0.8" />
          </svg>
        </div>
        <div className="absolute top-1/2 right-4 -translate-y-1/2 translate-x-1/2">
          <span className="text-xs font-semibold text-white/60">{inbound.destination}</span>
        </div>
      </div>
    </SectionCard>
  );
}
