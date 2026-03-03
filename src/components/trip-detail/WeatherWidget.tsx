"use client";

import { useEffect, useState } from "react";
import type { WeatherDay } from "@/types/trip-content";
import WeatherIcon, { getWeatherLabel } from "./WeatherIcon";
import MissingInfoCard from "./MissingInfoCard";

interface WeatherWidgetProps {
  destination: string;
  startDate?: string;
  endDate?: string;
  tripId: string;
}

export default function WeatherWidget({ destination, startDate, endDate, tripId }: WeatherWidgetProps) {
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [available, setAvailable] = useState(true);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const hasDates = !!(startDate && endDate);

  useEffect(() => {
    if (!hasDates || !destination) {
      setLoading(false);
      return;
    }

    fetch(`/api/weather?destination=${encodeURIComponent(destination)}&start=${startDate}&end=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.available === false) {
          setAvailable(false);
          setReason(data.reason);
        } else if (data.days?.length > 0) {
          setDays(data.days);
        } else {
          setAvailable(false);
        }
      })
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false));
  }, [destination, startDate, endDate, hasDates]);

  if (!hasDates) {
    return (
      <div className="widget-section">
        <div className="widget-header">
          <span style={{ fontSize: "1.25rem" }}>🌤</span>
          <h2 className="widget-title">Weather</h2>
        </div>
        <MissingInfoCard
          tripId={tripId}
          field="dates"
          icon="📅"
          title="Set your travel dates"
          description="Add dates to see the weather forecast for your trip"
          variant="teal"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="widget-section">
        <div className="widget-header">
          <span style={{ fontSize: "1.25rem" }}>🌤</span>
          <h2 className="widget-title">Weather</h2>
        </div>
        <div className="weather-widget animate-pulse">
          <div className="glass-panel rounded-2xl h-24 mb-4" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl h-16 w-16 flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!available || days.length === 0) {
    return (
      <div className="widget-section">
        <div className="widget-header">
          <span style={{ fontSize: "1.25rem" }}>🌤</span>
          <h2 className="widget-title">Weather</h2>
        </div>
        <div className="weather-widget">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {reason === "too_far_out"
              ? "Weather forecast available closer to your trip"
              : "Weather data unavailable for this destination"}
          </p>
        </div>
      </div>
    );
  }

  const selected = days[selectedIdx];
  const dayName = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short" });
  };
  const dayNum = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.getDate();
  };

  return (
    <div className="widget-section">
      <div className="widget-header">
        <span style={{ fontSize: "1.25rem" }}>🌤</span>
        <h2 className="widget-title">Weather</h2>
      </div>

      <div className="weather-widget">
        {/* Main display */}
        <div className="weather-main">
          <div className="flex items-center gap-4">
            <WeatherIcon code={selected.weather_code} size={48} />
            <div>
              <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                {Math.round(selected.temp_max)}°
              </p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Low {Math.round(selected.temp_min)}°
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {getWeatherLabel(selected.weather_code)}
            </p>
            {selected.precipitation_probability > 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--blue)" }}>
                {selected.precipitation_probability}% rain
              </p>
            )}
            {selected.wind_speed_max > 30 && (
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                Wind {Math.round(selected.wind_speed_max)} km/h
              </p>
            )}
          </div>
        </div>

        {/* Day pills */}
        <div className="weather-day-scroll">
          {days.map((day, i) => (
            <button
              key={day.date}
              className={`weather-day-pill ${i === selectedIdx ? "weather-day-pill-active" : ""}`}
              onClick={() => setSelectedIdx(i)}
            >
              <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                {dayName(day.date)}
              </span>
              <WeatherIcon code={day.weather_code} size={20} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {Math.round(day.temp_max)}°
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
