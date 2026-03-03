import type { TripData, Traveler, Flight } from "@/types/trip";
import type { SavedMemory } from "@/types/agent";
import { saveMemory } from "@/lib/supabase/memories";

interface ToolResult {
  updatedTripData: TripData;
  memories: SavedMemory[];
  formComplete: boolean;
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
  toolUseBlocks: Array<{ name: string; input: Record<string, unknown> }>,
  tripData: TripData,
  userId: string | null
): Promise<ToolResult> {
  let updatedTripData = { ...tripData };
  const memories: SavedMemory[] = [];
  let formComplete = false;

  for (const block of toolUseBlocks) {
    switch (block.name) {
      case "update_trip_data": {
        updatedTripData = mergeTripData(updatedTripData, block.input);
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
          // No user — still report it to the client for display
          memories.push({
            id: crypto.randomUUID(),
            category,
            content,
            person_name: (person_name as string) ?? null,
          });
        }
        break;
      }
      case "mark_form_complete": {
        formComplete = true;
        break;
      }
    }
  }

  return { updatedTripData, memories, formComplete };
}
