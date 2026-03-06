import { NextRequest, NextResponse } from "next/server";
import type { WeatherDay } from "@/types/trip-content";

// Server-side geocode cache — avoids re-geocoding the same destination
const geoCache = new Map<string, { lat: number; lon: number; ts: number }>();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function geocode(destination: string): Promise<{ lat: number; lon: number } | null> {
  const key = destination.toLowerCase().trim();
  const cached = geoCache.get(key);
  if (cached && Date.now() - cached.ts < GEO_CACHE_TTL) {
    return { lat: cached.lat, lon: cached.lon };
  }

  // Try Open-Meteo geocoding
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`
  );
  const geoData = await geoRes.json();

  if (geoData.results && geoData.results.length > 0) {
    const { latitude, longitude } = geoData.results[0];
    geoCache.set(key, { lat: latitude, lon: longitude, ts: Date.now() });
    return { lat: latitude, lon: longitude };
  }

  // Fallback: Nominatim
  const nomRes = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
    { headers: { "User-Agent": "heha-app/1.0" } }
  );
  const nomData = await nomRes.json();

  if (nomData && nomData.length > 0) {
    const lat = parseFloat(nomData[0].lat);
    const lon = parseFloat(nomData[0].lon);
    geoCache.set(key, { lat, lon, ts: Date.now() });
    return { lat, lon };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!destination || !start || !end) {
    return NextResponse.json(
      { error: "Missing destination, start, or end params" },
      { status: 400 }
    );
  }

  const startDate = new Date(start);
  const now = new Date();
  const daysOut = Math.floor(
    (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If trip is beyond 16-day forecast range, show next 7 days as preview
  const isPreview = daysOut > 16;

  try {
    // Step 1: Geocode destination (cached, with fallback)
    const geo = await geocode(destination);
    if (!geo) {
      return NextResponse.json({
        available: false,
        reason: "location_not_found",
        days: [],
      });
    }
    const { lat: latitude, lon: longitude } = geo;

    let fetchStart: string;
    let fetchEnd: string;

    if (isPreview) {
      // Show next 7 days from today as a preview
      fetchStart = now.toISOString().split("T")[0];
      const previewEnd = new Date(now);
      previewEnd.setDate(previewEnd.getDate() + 6);
      fetchEnd = previewEnd.toISOString().split("T")[0];
    } else {
      // Clamp dates to forecast range
      const forecastEnd = new Date(now);
      forecastEnd.setDate(forecastEnd.getDate() + 16);

      fetchStart = startDate < now ? now.toISOString().split("T")[0] : start;
      const endDate = new Date(end);
      fetchEnd =
        endDate > forecastEnd
          ? forecastEnd.toISOString().split("T")[0]
          : end;
    }

    // Step 2: Fetch weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max&start_date=${fetchStart}&end_date=${fetchEnd}&timezone=auto`
    );
    const weatherData = await weatherRes.json();

    if (!weatherData.daily) {
      return NextResponse.json({
        available: false,
        reason: "no_data",
        days: [],
      });
    }

    const days: WeatherDay[] = weatherData.daily.time.map(
      (date: string, i: number) => ({
        date,
        temp_max: weatherData.daily.temperature_2m_max[i],
        temp_min: weatherData.daily.temperature_2m_min[i],
        weather_code: weatherData.daily.weathercode[i],
        precipitation_probability:
          weatherData.daily.precipitation_probability_max[i],
        wind_speed_max: weatherData.daily.windspeed_10m_max[i],
      })
    );

    return NextResponse.json({ available: true, days, preview: isPreview }, {
      headers: { "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
