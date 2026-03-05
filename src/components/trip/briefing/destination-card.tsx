import Image from "next/image";
import type { DestinationInfo } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface DestinationCardProps {
  destination: DestinationInfo;
  delay?: number;
}

function formatPopulation(pop: number): string {
  if (pop >= 1_000_000_000) return `${(pop / 1_000_000_000).toFixed(1)}B`;
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${(pop / 1_000).toFixed(0)}K`;
  return pop.toString();
}

export function DestinationCard({ destination, delay }: DestinationCardProps) {
  return (
    <SectionCard title="Destination" accentColor="var(--gold)" delay={delay}>
      <div className="flex items-center gap-2 mb-1">
        {destination.flagUrl && (
          <Image
            src={destination.flagUrl}
            alt={`${destination.country} flag`}
            width={24}
            height={16}
            className="rounded-sm object-cover"
            unoptimized
          />
        )}
        <p className="text-lg font-semibold text-white/90">
          {destination.city}, {destination.country}
        </p>
      </div>

      {destination.region && (
        <p className="text-xs text-white/40 mb-3">{destination.region}</p>
      )}

      {destination.description && (
        <p className="text-xs text-white/40 mb-4 line-clamp-3">{destination.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Currency */}
        <div className="rounded-xl bg-white/5 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Currency</p>
          <p className="text-sm font-medium text-white/90">
            {destination.currency ?? "—"}
          </p>
        </div>

        {/* Language */}
        <div className="rounded-xl bg-white/5 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Language</p>
          <p className="text-sm font-medium text-white/90">
            {destination.languages.length > 0 ? destination.languages.join(", ") : "—"}
          </p>
        </div>

        {/* Timezone */}
        {destination.timezone && (
          <div className="rounded-xl bg-white/5 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Timezone</p>
            <p className="text-sm font-medium text-white/90">{destination.timezone}</p>
          </div>
        )}

        {/* Calling code */}
        {destination.callingCode && (
          <div className="rounded-xl bg-white/5 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Dialling Code</p>
            <p className="text-sm font-medium text-white/90">{destination.callingCode}</p>
          </div>
        )}

        {/* Driving side */}
        {destination.drivingSide && (
          <div className="rounded-xl bg-white/5 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Drives on</p>
            <p className="text-sm font-medium text-white/90 capitalize">{destination.drivingSide}</p>
          </div>
        )}

        {/* Population */}
        {destination.population && (
          <div className="rounded-xl bg-white/5 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Population</p>
            <p className="text-sm font-medium text-white/90">{formatPopulation(destination.population)}</p>
          </div>
        )}
      </div>

      {/* Season note */}
      {destination.seasonNote && (
        <p className="text-xs text-teal-400/70 mb-2">{destination.seasonNote}</p>
      )}

      {/* Travel advisories */}
      {destination.travelAdvisories.length > 0 && (
        <div className="mt-2 space-y-1">
          {destination.travelAdvisories.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400/70" />
              <p className="text-white/50">
                <span className="font-medium text-amber-400/80">{a.level}</span>
                {" — "}
                {a.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
