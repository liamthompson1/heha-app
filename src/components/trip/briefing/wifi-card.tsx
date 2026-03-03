import type { AirportWifi } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface WifiCardProps {
  wifi: AirportWifi;
  delay?: number;
}

const speedColors: Record<AirportWifi["speedRating"], string> = {
  fast: "text-emerald-400",
  moderate: "text-amber-400",
  slow: "text-red-400",
};

const pricingLabels: Record<AirportWifi["pricing"], string> = {
  free: "Free",
  paid: "Paid",
  freemium: "Free tier available",
};

export function WifiCard({ wifi, delay }: WifiCardProps) {
  return (
    <SectionCard title="Airport Wi-Fi" accentColor="var(--teal)" delay={delay}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Network</span>
          <span className="font-mono text-sm text-white/90">{wifi.networkName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Speed</span>
          <span className={`text-sm font-medium capitalize ${speedColors[wifi.speedRating]}`}>
            {wifi.speedRating}
            {wifi.avgSpeedMbps && <span className="ml-1.5 text-xs text-white/40">~{wifi.avgSpeedMbps} Mbps</span>}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Pricing</span>
          <span className="text-sm text-white/80">{pricingLabels[wifi.pricing]}</span>
        </div>
        {wifi.pricingNote && <p className="text-xs text-white/40 pt-1">{wifi.pricingNote}</p>}
      </div>
    </SectionCard>
  );
}
