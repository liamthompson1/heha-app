import type { WeatherComparison, AirportWeather } from "@/types/briefing";
import { SectionCard } from "./section-card";

interface WeatherCardProps {
  weather: WeatherComparison;
  delay?: number;
}

function WeatherIcon({ condition }: { condition: AirportWeather["condition"] }) {
  switch (condition) {
    case "sunny":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="6" fill="#EAAB2D" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line key={angle} x1="16" y1="4" x2="16" y2="7" stroke="#EAAB2D" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${angle} 16 16)`} />
          ))}
        </svg>
      );
    case "cloudy":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M10 24a5 5 0 0 1-.3-10A7 7 0 0 1 23 15a4 4 0 0 1-1 7.9H10z" fill="rgba(255,255,255,0.5)" />
        </svg>
      );
    case "rainy":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M10 20a4 4 0 0 1-.2-8A6 6 0 0 1 21 13a3.5 3.5 0 0 1-.8 6.9H10z" fill="rgba(255,255,255,0.5)" />
          <line x1="12" y1="24" x2="11" y2="27" stroke="#2F95F3" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="24" x2="15" y2="27" stroke="#2F95F3" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="24" x2="19" y2="27" stroke="#2F95F3" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "partly-cloudy":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="14" cy="12" r="5" fill="#EAAB2D" />
          <path d="M12 24a4 4 0 0 1-.2-8A6 6 0 0 1 23 17a3.5 3.5 0 0 1-.8 6.9H12z" fill="rgba(255,255,255,0.5)" />
        </svg>
      );
    case "stormy":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M10 18a4 4 0 0 1-.2-8A6 6 0 0 1 21 11a3.5 3.5 0 0 1-.8 6.9H10z" fill="rgba(255,255,255,0.4)" />
          <path d="M16 21l-2 5h3l-2 5" stroke="#EAAB2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

const conditionLabels: Record<AirportWeather["condition"], string> = {
  sunny: "Sunny",
  cloudy: "Cloudy",
  rainy: "Rainy",
  "partly-cloudy": "Partly Cloudy",
  stormy: "Stormy",
};

function AirportWeatherColumn({ data, heading }: { data: AirportWeather; heading: string }) {
  return (
    <div className="flex-1 text-center space-y-2">
      <p className="text-sm font-semibold text-white/80 mb-1">{heading}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{data.airportIata}</p>
      <div className="flex justify-center"><WeatherIcon condition={data.condition} /></div>
      <p className="text-2xl font-bold text-white/90">{data.tempCelsius}°C</p>
      <p className="text-xs text-white/60">{conditionLabels[data.condition]}</p>
      <p className="text-xs text-white/40">{data.rainChancePercent}% rain</p>
      <p className="mt-2 text-xs text-teal-400/80">{data.packingHint}</p>
    </div>
  );
}

export function WeatherCard({ weather, delay }: WeatherCardProps) {
  return (
    <SectionCard title="Weather" accentColor="var(--teal)" delay={delay}>
      <p className="text-xs text-white/40 mb-4">{weather.forecastLabel}</p>
      <div className="flex gap-4">
        <AirportWeatherColumn data={weather.departure} heading="Departure" />
        <div className="w-px bg-white/10 self-stretch" />
        <AirportWeatherColumn data={weather.arrival} heading="Arrival" />
      </div>
    </SectionCard>
  );
}
