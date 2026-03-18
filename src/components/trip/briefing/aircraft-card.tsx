import type { AircraftDetails } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface AircraftCardProps {
  aircraft: AircraftDetails;
  delay?: number;
}

export function AircraftCard({ aircraft, delay }: AircraftCardProps) {
  return (
    <SectionCard title="Aircraft Details" accentColor="var(--purple)" delay={delay}>
      <p className="text-lg font-semibold text-white/90 mb-4">{aircraft.aircraftType}</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/5 px-3 py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Tail</p>
          <p className="text-sm font-medium font-mono text-white/90">{aircraft.tailNumber}</p>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Age</p>
          <p className="text-sm font-medium text-white/90">{aircraft.ageYears} yrs</p>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Seats</p>
          <p className="text-sm font-medium text-white/90">{aircraft.seatCount}</p>
          <p className="text-[10px] text-white/40">{aircraft.seatConfig}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-white/40">{aircraft.note}</p>
    </SectionCard>
  );
}
