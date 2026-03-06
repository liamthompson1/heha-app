"use client";

import { useState } from "react";
import type { WeatherDay } from "@/types/trip-content";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import WeatherIcon, { getWeatherLabel } from "./WeatherIcon";
import MissingInfoCard from "./MissingInfoCard";

interface WeatherData {
  days: WeatherDay[];
  available: boolean;
  reason: string;
  preview: boolean;
}

interface WeatherWidgetProps {
  destination: string;
  startDate?: string;
  endDate?: string;
  tripId: string;
}

export default function WeatherWidget({ destination, startDate, endDate, tripId }: WeatherWidgetProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const hasDates = !!(startDate && endDate);

  // Extract city from route-style names like "Gatwick to Amsterdam Schiphol"
  let weatherDest = destination;
  if (weatherDest?.toLowerCase().includes(" to ")) {
    weatherDest = weatherDest.split(/ to /i).pop()!.trim();
  }
  // Normalize dates: strip time portion if full ISO datetime
  const normStart = startDate?.includes("T") ? startDate.split("T")[0] : startDate;
  const normEnd = endDate?.includes("T") ? endDate.split("T")[0] : endDate;

  const weatherUrl = hasDates && weatherDest
    ? `/api/weather?destination=${encodeURIComponent(weatherDest)}&start=${normStart}&end=${normEnd}`
    : null;

  const { data: weather, loading } = useCachedFetch<WeatherData>(
    weatherUrl,
    {
      transform: (raw) => {
        const r = raw as Record<string, unknown>;
        return {
          days: (r.days as WeatherDay[]) ?? [],
          available: r.available !== false,
          reason: (r.reason as string) ?? "",
          preview: !!(r.preview),
        };
      },
    }
  );

  const days = weather?.days ?? [];
  const available = weather?.available ?? true;
  const reason = weather?.reason ?? "";
  const isPreview = weather?.preview ?? false;

  const dayName = (dateStr: string) => {
    const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const d = new Date(dateOnly + "T12:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short" });
  };

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
        <div className="weather-card animate-pulse">
          <div className="weather-card-top">
            <div>
              <div className="rounded-lg h-4 w-24 mb-3" style={{ background: "rgba(255,255,255,0.2)" }} />
              <div className="rounded-lg h-10 w-20" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-full w-10 h-10" style={{ background: "rgba(255,255,255,0.15)" }} />
              <div className="rounded-lg h-3 w-16" style={{ background: "rgba(255,255,255,0.12)" }} />
            </div>
          </div>
          <div className="weather-card-divider" />
          <div className="weather-card-days">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="weather-card-day">
                <div className="rounded h-2 w-6" style={{ background: "rgba(255,255,255,0.15)" }} />
                <div className="rounded-full w-5 h-5" style={{ background: "rgba(255,255,255,0.12)" }} />
                <div className="rounded h-3 w-6" style={{ background: "rgba(255,255,255,0.15)" }} />
              </div>
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
        <div className="weather-card" style={{ padding: "28px" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {reason === "too_far_out"
              ? "Weather forecast available closer to your trip"
              : "Weather data unavailable for this destination"}
          </p>
        </div>
      </div>
    );
  }

  const selected = days[selectedIdx];

  return (
    <div className="widget-section">
      <div className="widget-header">
        <span style={{ fontSize: "1.25rem" }}>🌤</span>
        <h2 className="widget-title">Weather</h2>
      </div>

      <div className="weather-card">
        {/* Top section: destination + temp left, icon + condition right */}
        <div className="weather-card-top">
          <div>
            <p className="weather-card-destination">{destination}</p>
            {isPreview && (
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Weather now
              </p>
            )}
            <p className="weather-card-temp">{Math.round(selected.temp_max)}°</p>
          </div>
          <div className="weather-card-right">
            <WeatherIcon code={selected.weather_code} size={40} />
            <p className="weather-card-condition">
              {getWeatherLabel(selected.weather_code)}
            </p>
            <p className="weather-card-hilo">
              H:{Math.round(selected.temp_max)}° L:{Math.round(selected.temp_min)}°
            </p>
          </div>
        </div>

        {/* Extra details */}
        {(selected.precipitation_probability > 0 || selected.wind_speed_max > 30) && (
          <div className="flex gap-4 mt-1 mb-1">
            {selected.precipitation_probability > 0 && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                💧 {selected.precipitation_probability}% rain
              </p>
            )}
            {selected.wind_speed_max > 30 && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                💨 {Math.round(selected.wind_speed_max)} km/h
              </p>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="weather-card-divider" />

        {/* Day pills */}
        <div className="weather-card-days">
          {days.map((day, i) => (
            <button
              key={day.date}
              className={`weather-card-day ${i === selectedIdx ? "weather-card-day-active" : ""}`}
              onClick={() => setSelectedIdx(i)}
            >
              <span className="weather-card-day-label">
                {i === 0 ? "Now" : dayName(day.date)}
              </span>
              <WeatherIcon code={day.weather_code} size={20} />
              <span className="weather-card-day-temp">
                {Math.round(day.temp_max)}°
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
