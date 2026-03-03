import type { TerminalRestaurants } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface RestaurantsCardProps {
  data: TerminalRestaurants;
  delay?: number;
}

export function RestaurantsCard({ data, delay }: RestaurantsCardProps) {
  return (
    <SectionCard title="Restaurants" accentColor="var(--coral)" delay={delay}>
      <div className="space-y-3">
        {data.restaurants.map((r) => (
          <div key={r.name} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/90">{r.name}</p>
              <p className="text-xs text-white/40">{r.cuisine} · {r.location}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-white/60">{r.priceRange}</p>
              <p className="text-xs text-white/30">{r.openingHours}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
