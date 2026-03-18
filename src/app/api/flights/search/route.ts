import { NextRequest, NextResponse } from "next/server";
import { searchFlights, saveFlightsToSupabase } from "@/lib/flights/hapi-client";
import { buildFlightReference } from "@/lib/flights/flight-reference";
import type { FlightCardData } from "@/types/agent";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const tripId = searchParams.get("tripId");
  const format = searchParams.get("format");
  const direction = searchParams.get("direction") as "outbound" | "return" | null;

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

    // Return FlightCardData[] when format=cards
    if (format === "cards") {
      const cards: FlightCardData[] = flights.map((f) => ({
        airline: f.flight.carrier.name,
        airline_code: f.flight.carrier.code,
        flight_number: f.flight.code,
        from: f.departure.airport_iata,
        from_city: f.departure.city,
        to: f.arrival.airport_iata,
        to_city: f.arrival.city,
        departure_date: f.departure.date,
        departure_time: f.departure.time,
        arrival_date: f.arrival.date,
        arrival_time: f.arrival.time,
        duration: f.flight.elapsed_time,
        flight_reference: buildFlightReference(f),
        direction: direction || "return",
      }));
      return NextResponse.json({ flights: cards, count: cards.length });
    }

    return NextResponse.json({ flights, count: flights.length });
  } catch (err) {
    console.error("Flight search error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
