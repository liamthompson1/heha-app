export interface FlightCarrier {
  code: string;
  name: string;
  url: string | null;
}

export interface FlightAircraft {
  code: string | null;
  name: string | null;
}

export interface FlightLocation {
  airport_iata: string;
  airport: string;
  country: string;
  date: string;
  time: string;
  city: string;
  terminal: string;
  region: number | null;
  country_iso: string;
}

export interface HapiFlight {
  flight: {
    code: string;
    number: string;
    icao: string[];
    matched: string;
    carrier: FlightCarrier;
    distance: string;
    elapsed_time: string;
    layover_time: string;
    aircraft: FlightAircraft;
  };
  departure: FlightLocation;
  arrival: FlightLocation;
}

export interface SearchFlightsParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
}
