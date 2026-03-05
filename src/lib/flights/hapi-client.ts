import type { HapiFlight, SearchFlightsParams } from "./types";
import { getSupabaseClient } from "@/lib/supabase/client";

const HAPI_HOST =
  process.env.HAPI_HOST || "https://hapi.holidayextras.co.uk";

export async function searchFlights(
  params: SearchFlightsParams
): Promise<HapiFlight[]> {
  const query = new URLSearchParams({
    location: params.origin,
    destination: params.destination,
    departure: params.departureDate,
    ...(params.returnDate && { to: params.returnDate }),
    country: "GB",
    size: "50",
    sort: "true",
  });

  const url = `${HAPI_HOST}/transport/flights?${query.toString()}`;
  console.log("[HAPI] Searching flights:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `HAPI request failed: ${response.status} ${response.statusText}`
    );
  }

  // 204 No Content = no flights found for this route/date
  if (response.status === 204) {
    return [];
  }

  const text = await response.text();
  if (!text) {
    return [];
  }

  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    return [];
  }

  // HAPI may return flights beyond the requested route — filter to exact match
  const origin = params.origin.toUpperCase();
  const destination = params.destination.toUpperCase();
  const filtered = (data as HapiFlight[]).filter(
    (f) =>
      f.departure.airport_iata === origin &&
      f.arrival.airport_iata === destination
  );

  if (filtered.length === 0 && data.length > 0) {
    const sample = (data as HapiFlight[]).slice(0, 3).map((f) => `${f.departure.airport_iata}→${f.arrival.airport_iata}`);
    console.log(`[HAPI] ${data.length} results but none match ${origin}→${destination}. Got: ${sample.join(", ")}`);
  } else {
    console.log(`[HAPI] ${data.length} total results, ${filtered.length} match ${origin}→${destination}`);
  }

  return filtered;
}

export async function saveFlightsToSupabase(
  flights: HapiFlight[],
  searchParams: { origin: string; destination: string; departureDate: string; returnDate?: string },
  tripId?: string
): Promise<void> {
  if (flights.length === 0) return;

  const rows = flights.map((f) => ({
    trip_id: tripId || null,
    flight_code: f.flight.code,
    flight_number: f.flight.number,
    carrier_code: f.flight.carrier.code,
    carrier_name: f.flight.carrier.name,
    departure_airport: f.departure.airport_iata,
    departure_city: f.departure.city,
    departure_country: f.departure.country,
    departure_date: f.departure.date,
    departure_time: f.departure.time,
    departure_terminal: f.departure.terminal,
    arrival_airport: f.arrival.airport_iata,
    arrival_city: f.arrival.city,
    arrival_country: f.arrival.country,
    arrival_date: f.arrival.date,
    arrival_time: f.arrival.time,
    arrival_terminal: f.arrival.terminal,
    distance: f.flight.distance,
    elapsed_time: f.flight.elapsed_time,
    search_origin: searchParams.origin,
    search_destination: searchParams.destination,
    search_departure_date: searchParams.departureDate,
    search_return_date: searchParams.returnDate || null,
  }));

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("flights").insert(rows);

  if (error) {
    console.error("Failed to save flights to Supabase:", error.message);
  }
}
