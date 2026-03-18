// Stub — external API integration not yet implemented

export interface FlightStatusResult {
  flightNumber: string;
  status: string;
  departureTerminal: string | null;
  departureGate: string | null;
  arrivalTerminal: string | null;
  baggageCarousel: string | null;
  aircraftType: string | null;
  aircraftRegistration: string | null;
}

export async function fetchFlightStatus(
  _flightNumber: string,
  _date: string
): Promise<FlightStatusResult | null> {
  return null;
}
