import type { TripData } from "@/types/trip";

/** Returns a list of field paths that have been filled in */
export function getFilledFields(data: TripData): string[] {
  const filled: string[] = [];

  if (data.name) filled.push("name");
  if (data.reason) filled.push("reason");
  if (data.how_we_are_travelling) filled.push("how_we_are_travelling");
  if (data.dates?.start_date) filled.push("dates.start_date");
  if (data.dates?.end_date) filled.push("dates.end_date");
  if (data.dates?.flexible_dates_notes) filled.push("dates.flexible_dates_notes");
  if (data.people_travelling?.length > 0) filled.push("people_travelling");
  if (data.journey_locations?.travelling_from) filled.push("journey_locations.travelling_from");
  if (data.journey_locations?.travelling_to) filled.push("journey_locations.travelling_to");
  if (data.journey_locations?.postcode_from) filled.push("journey_locations.postcode_from");
  if (data.journey_locations?.postcode_to) filled.push("journey_locations.postcode_to");
  if (data.journey_locations?.nearest_airport) filled.push("journey_locations.nearest_airport");
  if (data.flights_if_known?.length > 0) filled.push("flights_if_known");
  if (data.preferences?.notes) filled.push("preferences.notes");
  if (data.anything_else_we_should_know) filled.push("anything_else_we_should_know");

  // boolean preferences — only note if true
  if (data.preferences?.travel_insurance) filled.push("preferences.travel_insurance");
  if (data.preferences?.airport_parking) filled.push("preferences.airport_parking");
  if (data.preferences?.airport_lounge) filled.push("preferences.airport_lounge");
  if (data.preferences?.car_hire) filled.push("preferences.car_hire");
  if (data.preferences?.airport_transfers) filled.push("preferences.airport_transfers");
  if (data.preferences?.extra_luggage) filled.push("preferences.extra_luggage");

  return filled;
}

const REQUIRED_FIELDS = [
  "reason",
  "name",
  "how_we_are_travelling",
  "dates.start_date",
  "dates.end_date",
  "people_travelling",
  "journey_locations.travelling_from",
  "journey_locations.travelling_to",
] as const;

/** Returns required fields that haven't been filled yet */
export function getMissingRequiredFields(data: TripData): string[] {
  const filled = new Set(getFilledFields(data));
  return REQUIRED_FIELDS.filter((f) => !filled.has(f));
}
