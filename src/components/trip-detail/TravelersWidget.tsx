"use client";

import type { ApiPerson } from "@/types/trip";
import MissingInfoCard from "./MissingInfoCard";

interface TravelersWidgetProps {
  travelers: ApiPerson[];
  tripId: string;
}

export default function TravelersWidget({ travelers, tripId }: TravelersWidgetProps) {
  const hasTravelers = travelers.length > 0;

  return (
    <div className="widget-section">
      <div className="widget-header">
        <span style={{ fontSize: "1.25rem" }}>👥</span>
        <h2 className="widget-title">Travelers</h2>
      </div>

      {hasTravelers ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {travelers.map((p, i) => (
            <div key={i} className="glass-panel traveler-card">
              <div className="traveler-avatar">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {p.name}
                </p>
                {p.age != null && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    Age {p.age}
                  </p>
                )}
                {p.dietary_requirements && p.dietary_requirements.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {p.dietary_requirements.join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <MissingInfoCard
          tripId={tripId}
          field="travelers"
          icon="👤"
          title="Add your travel group"
          description="Tell us who's coming along"
          variant="purple"
        />
      )}
    </div>
  );
}
