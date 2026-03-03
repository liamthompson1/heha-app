import type { HapiFlight, SearchFlightsParams } from "./types";
import { getSupabaseClient } from "@/lib/supabase/client";

const HAPI_HOST =
  process.env.HAPI_HOST || "https://hapi-staging.holidayextras.co.uk";

export async function searchFlights(
  params: SearchFlightsParams
): Promise<HapiFlight[]> {
  const query = new URLSearchParams({
    airport: params.origin,
    arrivalAirport: params.destination,
    departDate: params.departureDate,
    ...(params.returnDate && { departDateTo: params.returnDate }),
    country: "GB",
    size: "5000",
    sort: "true",
  });

  const url = `${HAPI_HOST}/transport/flight?${query.toString()}`;

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

  return data as HapiFlight[];
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
