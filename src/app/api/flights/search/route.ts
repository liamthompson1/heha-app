import { NextRequest, NextResponse } from "next/server";
import { searchFlights, saveFlightsToSupabase } from "@/lib/flights/hapi-client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const tripId = searchParams.get("tripId");

  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      {
        error: "Missing required query parameters: origin, destination, departureDate",
      },
      { status: 400 }
    );
  }

  try {
    const flights = await searchFlights({
      origin,
      destination,
      departureDate,
      ...(returnDate && { returnDate }),
    });

    // Fire-and-forget: persist to Supabase without blocking the response
    saveFlightsToSupabase(
      flights,
      { origin, destination, departureDate, ...(returnDate && { returnDate }) },
      tripId || undefined
    ).catch((err) => console.error("Background flight save failed:", err));

    return NextResponse.json({ flights, count: flights.length });
  } catch (err) {
    console.error("Flight search error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
