import { NextRequest, NextResponse } from "next/server";
import type { WeatherDay } from "@/types/trip-content";

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
    // Step 1: Geocode destination
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return NextResponse.json({
        available: false,
        reason: "location_not_found",
        days: [],
      });
    }

    const { latitude, longitude } = geoData.results[0];

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

    return NextResponse.json({ available: true, days, preview: isPreview });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
