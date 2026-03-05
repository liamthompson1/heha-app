import type { HapiFlight } from "./types";

/**
 * Build a flight reference string from HAPI flight data.
 * Format: base64(departureIATA + arrivalIATA + date + flightCode)
 */
export function buildFlightReference(flight: HapiFlight): string {
  const raw =
    flight.departure.airport_iata +
    flight.arrival.airport_iata +
    flight.departure.date +
    flight.flight.code;
  return Buffer.from(raw).toString("base64");
}
