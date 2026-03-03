export interface Traveler {
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
}

export interface JourneyLocations {
  travelling_from: string;
  postcode_from: string;
  travelling_to: string;
  postcode_to: string;
  nearest_airport: string;
}

export interface Flight {
  airline: string;
  flight_number: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  from_airport: string;
  to_airport: string;
  direction: "outbound" | "return";
}

export interface TripDates {
  start_date: string;
  end_date: string;
  flexible_dates_notes: string;
}

export interface Preferences {
  travel_insurance: boolean;
  airport_parking: boolean;
  airport_lounge: boolean;
  car_hire: boolean;
  airport_transfers: boolean;
  extra_luggage: boolean;
  notes: string;
}

export interface TripData {
  name: string;
  reason: string;
  how_we_are_travelling: string;
  dates: TripDates;
  people_travelling: Traveler[];
  journey_locations: JourneyLocations;
  flights_if_known: Flight[];
  preferences: Preferences;
  anything_else_we_should_know: string;
}

export const emptyTripData: TripData = {
  name: "",
  reason: "",
  how_we_are_travelling: "",
  dates: {
    start_date: "",
    end_date: "",
    flexible_dates_notes: "",
  },
  people_travelling: [],
  journey_locations: {
    travelling_from: "",
    postcode_from: "",
    travelling_to: "",
    postcode_to: "",
    nearest_airport: "",
  },
  flights_if_known: [],
  preferences: {
    travel_insurance: false,
    airport_parking: false,
    airport_lounge: false,
    car_hire: false,
    airport_transfers: false,
    extra_luggage: false,
    notes: "",
  },
  anything_else_we_should_know: "",
};

// --- API types (POST /api/trips) ---

export interface ApiTripDetails {
  destination: string;
  start_date: string;
  end_date: string;
  trip_type?: string;
}

export interface ApiPerson {
  name: string;
  age?: number;
  dietary_requirements?: string[];
}

export interface ApiPreferences {
  budget?: string;
  accommodation_type?: string;
  activities?: string[];
  pace?: string;
}

export interface ApiFlight {
  airline?: string;
  flight_number?: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time?: string;
  arrival_time?: string;
}

export interface ApiJourneyLocations {
  origin?: string;
  stops?: string[];
}

export interface CreateTripRequest {
  user_id: string;
  trip: ApiTripDetails;
  people_travelling: ApiPerson[];
  preferences: ApiPreferences;
  flights_if_known?: ApiFlight[];
  journey_locations?: ApiJourneyLocations;
  anything_else_we_should_know?: string;
}

export interface TripRow extends CreateTripRequest {
  id: string;
  created_at: string;
  traveller_api_synced: boolean;
  traveller_trip_id: string | null;
}

export interface CreateTripResponse {
  trip: TripRow;
  traveller_api: {
    synced: boolean;
    trip_id: string | null;
    error: string | null;
  };
}

// --- Dummy data ---

export const dummyTripData: TripData = {
  name: "Summer in Barcelona",
  reason: "Holiday",
  how_we_are_travelling: "Flying",
  dates: {
    start_date: "2026-07-10",
    end_date: "2026-07-20",
    flexible_dates_notes: "Could move by a day or two either side",
  },
  people_travelling: [
    {
      first_name: "Alex",
      last_name: "Morgan",
      dob: "1990-04-15",
      gender: "Male",
      email: "alex@example.com",
      phone: "+44 7700 900123",
    },
    {
      first_name: "Sam",
      last_name: "Morgan",
      dob: "1992-08-22",
      gender: "Female",
      email: "sam@example.com",
      phone: "+44 7700 900456",
    },
  ],
  journey_locations: {
    travelling_from: "London",
    postcode_from: "SW1A 1AA",
    travelling_to: "Barcelona",
    postcode_to: "08001",
    nearest_airport: "LHR",
  },
  flights_if_known: [
    {
      airline: "British Airways",
      flight_number: "BA478",
      departure_date: "2026-07-10",
      departure_time: "08:30",
      arrival_date: "2026-07-10",
      arrival_time: "11:45",
      from_airport: "LHR",
      to_airport: "BCN",
      direction: "outbound",
    },
    {
      airline: "British Airways",
      flight_number: "BA479",
      departure_date: "2026-07-20",
      departure_time: "14:15",
      arrival_date: "2026-07-20",
      arrival_time: "15:30",
      from_airport: "BCN",
      to_airport: "LHR",
      direction: "return",
    },
  ],
  preferences: {
    travel_insurance: true,
    airport_parking: true,
    airport_lounge: false,
    car_hire: true,
    airport_transfers: true,
    extra_luggage: false,
    notes: "We'd like a hotel near the beach with a pool.",
  },
  anything_else_we_should_know:
    "It's our anniversary — any special restaurant recommendations would be amazing!",
};
