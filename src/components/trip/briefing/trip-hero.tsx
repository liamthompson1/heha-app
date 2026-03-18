import type { BriefingFlight } from "@/types/briefing";

interface TripHeroProps {
  flight: BriefingFlight;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TripHero({ flight }: TripHeroProps) {
  const depTime = formatTime(flight.scheduledDepartureTime);
  const arrTime = formatTime(flight.scheduledArrivalTime);
  const date = formatDate(flight.scheduledDepartureTime);

  return (
    <header
      className="text-center mb-6"
      style={{ animation: "fade-in-up 0.6s ease-out both" }}
    >
      <p className="text-xs uppercase tracking-widest text-white/50 mb-2">
        {flight.airline} &middot; {flight.flightNumber}
      </p>

      <div className="flex items-center justify-center gap-4">
        <div className="text-right">
          <p className="text-3xl font-bold text-white/90 sm:text-4xl">{flight.departure.iata}</p>
          <p className="text-xs text-white/40 mt-0.5">{flight.departure.city}</p>
        </div>

        <div className="flex flex-col items-center gap-1 px-2">
          <div className="h-px w-12 bg-white/20" />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40">
            <path d="M1 8h14M11 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="h-px w-12 bg-white/20" />
        </div>

        <div className="text-left">
          <p className="text-3xl font-bold text-white/90 sm:text-4xl">{flight.arrival.iata}</p>
          <p className="text-xs text-white/40 mt-0.5">{flight.arrival.city}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-8 text-sm text-white/60">
        <div>
          <span className="font-medium text-white/80">{depTime}</span>
          {flight.departure.terminal && (
            <span className="ml-1.5 text-xs text-white/40">{flight.departure.terminal}</span>
          )}
        </div>
        <span className="text-white/20">&rarr;</span>
        <div>
          <span className="font-medium text-white/80">{arrTime}</span>
          {flight.arrival.terminal && (
            <span className="ml-1.5 text-xs text-white/40">{flight.arrival.terminal}</span>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-white/40">{date}</p>
    </header>
  );
}
