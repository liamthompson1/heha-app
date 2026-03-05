import type { TripData, Traveler, Flight } from "@/types/trip";
import type { SavedMemory, FlightCardData } from "@/types/agent";
import { saveMemory } from "@/lib/supabase/memories";
import { searchFlights } from "@/lib/flights/hapi-client";
import { buildFlightReference } from "@/lib/flights/flight-reference";

interface ToolResult {
  updatedTripData: TripData;
  memories: SavedMemory[];
  formComplete: boolean;
  /** Per-tool result content to feed back to Claude (keyed by tool_use_id) */
  toolResults: Record<string, string>;
  flightCards?: FlightCardData[];
  flightSearchParams?: { origin: string; destination: string; departureDate: string; returnDate?: string };
}

/** Deep-merge partial trip data updates into existing tripData */
function mergeTripData(
  existing: TripData,
  partial: Record<string, unknown>
): TripData {
  const merged = { ...existing };

  // Simple string fields
  const stringFields = [
    "name",
    "reason",
    "how_we_are_travelling",
    "anything_else_we_should_know",
  ] as const;
  for (const key of stringFields) {
    if (typeof partial[key] === "string") {
      merged[key] = partial[key] as string;
    }
  }

  // Dates — deep merge
  if (partial.dates && typeof partial.dates === "object") {
    const d = partial.dates as Record<string, string>;
    merged.dates = {
      start_date: d.start_date ?? existing.dates?.start_date ?? "",
      end_date: d.end_date ?? existing.dates?.end_date ?? "",
      flexible_dates_notes:
        d.flexible_dates_notes ?? existing.dates?.flexible_dates_notes ?? "",
    };
  }

  // People — full replace
  if (Array.isArray(partial.people_travelling)) {
    merged.people_travelling = (
      partial.people_travelling as Record<string, string>[]
    ).map(
      (p): Traveler => ({
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        dob: p.dob || "",
        gender: p.gender || "",
        email: p.email || "",
        phone: p.phone || "",
      })
    );
  }

  // Journey locations — deep merge
  if (
    partial.journey_locations &&
    typeof partial.journey_locations === "object"
  ) {
    const j = partial.journey_locations as Record<string, string>;
    merged.journey_locations = {
      travelling_from:
        j.travelling_from ?? existing.journey_locations?.travelling_from ?? "",
      postcode_from:
        j.postcode_from ?? existing.journey_locations?.postcode_from ?? "",
      travelling_to:
        j.travelling_to ?? existing.journey_locations?.travelling_to ?? "",
      postcode_to: j.postcode_to ?? existing.journey_locations?.postcode_to ?? "",
      nearest_airport:
        j.nearest_airport ?? existing.journey_locations?.nearest_airport ?? "",
    };
  }

  // Flights — full replace
  if (Array.isArray(partial.flights_if_known)) {
    merged.flights_if_known = (
      partial.flights_if_known as Record<string, string>[]
    ).map(
      (f): Flight => ({
        airline: f.airline || "",
        flight_number: f.flight_number || "",
        departure_date: f.departure_date || "",
        departure_time: f.departure_time || "",
        arrival_date: f.arrival_date || "",
        arrival_time: f.arrival_time || "",
        from_airport: f.from_airport || "",
        to_airport: f.to_airport || "",
        direction: (f.direction as "outbound" | "return") || "outbound",
        flight_reference: f.flight_reference || undefined,
      })
    );
  }

  // Preferences — deep merge
  if (partial.preferences && typeof partial.preferences === "object") {
    const p = partial.preferences as Record<string, unknown>;
    merged.preferences = {
      travel_insurance:
        typeof p.travel_insurance === "boolean"
          ? p.travel_insurance
          : existing.preferences?.travel_insurance ?? false,
      airport_parking:
        typeof p.airport_parking === "boolean"
          ? p.airport_parking
          : existing.preferences?.airport_parking ?? false,
      airport_lounge:
        typeof p.airport_lounge === "boolean"
          ? p.airport_lounge
          : existing.preferences?.airport_lounge ?? false,
      car_hire:
        typeof p.car_hire === "boolean"
          ? p.car_hire
          : existing.preferences?.car_hire ?? false,
      airport_transfers:
        typeof p.airport_transfers === "boolean"
          ? p.airport_transfers
          : existing.preferences?.airport_transfers ?? false,
      extra_luggage:
        typeof p.extra_luggage === "boolean"
          ? p.extra_luggage
          : existing.preferences?.extra_luggage ?? false,
      notes: typeof p.notes === "string" ? p.notes : existing.preferences?.notes ?? "",
    };
  }

  return merged;
}

export async function handleToolCalls(
  toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }>,
  tripData: TripData,
  userId: string | null
): Promise<ToolResult> {
  let updatedTripData = { ...tripData };
  const memories: SavedMemory[] = [];
  let formComplete = false;
  const toolResults: Record<string, string> = {};
  let flightCards: FlightCardData[] | undefined;
  let flightSearchParams: ToolResult["flightSearchParams"];

  for (const block of toolUseBlocks) {
    switch (block.name) {
      case "update_trip_data": {
        updatedTripData = mergeTripData(updatedTripData, block.input);
        toolResults[block.id] = JSON.stringify({ success: true });
        break;
      }
      case "save_memory": {
        const { category, content, person_name } = block.input as {
          category: string;
          content: string;
          person_name?: string;
        };
        if (userId) {
          const saved = await saveMemory(
            userId,
            category,
            content,
            (person_name as string) ?? null
          );
          if (saved) memories.push(saved);
        } else {
          memories.push({
            id: crypto.randomUUID(),
            category,
            content,
            person_name: (person_name as string) ?? null,
          });
        }
        toolResults[block.id] = JSON.stringify({ success: true });
        break;
      }
      case "search_flights": {
        const { origin, destination, departure_date, return_date, direction } =
          block.input as {
            origin: string;
            destination: string;
            departure_date: string;
            return_date?: string;
            direction?: "outbound" | "return";
          };
        try {
          const allFlights = await searchFlights({
            origin,
            destination,
            departureDate: departure_date,
            ...(return_date && { returnDate: return_date }),
          });

          const flightDirection = direction || "outbound";

          // Give Claude a summary of top 5 flights (just enough context)
          const topForClaude = allFlights.slice(0, 5).map((f) => ({
            airline: f.flight.carrier.name,
            flight_number: f.flight.code,
            from: `${f.departure.airport_iata} (${f.departure.city})`,
            to: `${f.arrival.airport_iata} (${f.arrival.city})`,
            departure: `${f.departure.date} ${f.departure.time}`,
            arrival: `${f.arrival.date} ${f.arrival.time}`,
            duration: f.flight.elapsed_time,
          }));

          // Build FlightCardData for UI — ALL flights, no slice
          flightCards = allFlights.map((f): FlightCardData => ({
            airline: f.flight.carrier.name,
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
            direction: flightDirection,
          }));

          // Capture search params for client-side return flight fetch
          flightSearchParams = {
            origin,
            destination,
            departureDate: departure_date,
            ...(return_date && { returnDate: return_date }),
          };

          toolResults[block.id] = JSON.stringify({
            total_found: allFlights.length,
            flights: topForClaude,
            note: "Full flight list shown in UI selector. User selects from there.",
          });
        } catch (err) {
          console.error("Flight search error:", err);
          toolResults[block.id] = JSON.stringify({
            error: "Flight search failed. Try different airports or dates.",
          });
        }
        break;
      }
      case "mark_form_complete": {
        formComplete = true;
        toolResults[block.id] = JSON.stringify({ success: true });
        break;
      }
      default: {
        toolResults[block.id] = JSON.stringify({ success: true });
      }
    }
  }

  return { updatedTripData, memories, formComplete, toolResults, flightCards, flightSearchParams };
}
