import type { InFlightAmenities } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface AmenitiesCardProps {
  amenities: InFlightAmenities;
  delay?: number;
}

export function AmenitiesCard({ amenities, delay }: AmenitiesCardProps) {
  if (!amenities.dataAvailable) return null;

  return (
    <SectionCard title="In-Flight Entertainment & Power" accentColor="var(--purple)" delay={delay}>
      <div className="space-y-3">
        {amenities.ifeType && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-white/50 shrink-0">Entertainment</span>
            <span className="text-sm text-white/80 text-right">{amenities.ifeType}</span>
          </div>
        )}
        {amenities.powerTypes && amenities.powerTypes.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Power</span>
            <div className="flex gap-2">
              {amenities.powerTypes.map((type) => (
                <span key={type} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">{type}</span>
              ))}
            </div>
          </div>
        )}
        {amenities.ifeNote && <p className="text-xs text-white/40 pt-1">{amenities.ifeNote}</p>}
        {amenities.powerNote && <p className="text-xs text-white/40">{amenities.powerNote}</p>}
      </div>
    </SectionCard>
  );
}
