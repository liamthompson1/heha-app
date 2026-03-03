// Flight briefing types — used by the trip/[id]/briefing page

export interface BriefingAirport {
  iata: string;
  name: string;
  city: string;
  terminal?: string;
}

export interface BriefingFlight {
  flightNumber: string;
  airline: string;
  aircraftType: string;
  departure: BriefingAirport;
  arrival: BriefingAirport;
  scheduledDepartureTime: string; // ISO 8601
  scheduledArrivalTime: string;
}

// --- On-Time Performance ---

export interface OnTimeBreakdown {
  earlyPercent: number;
  onTimePercent: number;
  lateUnder1hrPercent: number;
  lateOver1hrPercent: number;
  cancelledPercent: number;
}

export interface OnTimeStats {
  onTimePercentage: number; // early + onTime combined
  avgDelayMinutesWhenLate: number;
  periodDays: number;
  sampleSize: number;
  breakdown: OnTimeBreakdown;
}

// --- Weather ---

export interface AirportWeather {
  airportIata: string;
  city: string;
  tempCelsius: number;
  condition: "sunny" | "cloudy" | "rainy" | "partly-cloudy" | "stormy";
  rainChancePercent: number;
  packingHint: string;
}

export interface WeatherComparison {
  departure: AirportWeather;
  arrival: AirportWeather;
  forecastLabel: string;
}

// --- Gate & Arrival Info ---

export type FlightStatus = "on-time" | "delayed" | "cancelled";

export interface GateInfo {
  flightStatus: FlightStatus;
  departureGate: string | null;
  departureGateNote?: string;
  arrivalTerminal: string | null;
  baggageCarousel: string | null;
  baggageNote?: string;
}

// --- Aircraft Details ---

export interface AircraftDetails {
  aircraftType: string;
  tailNumber: string;
  ageYears: number;
  seatCount: number;
  seatConfig: string;
  note: string;
}

// --- Inbound Aircraft ---

export interface InboundFlight {
  flightNumber: string;
  origin: string;
  destination: string;
  scheduledArrival: string;
  status: "en-route" | "landed" | "scheduled";
  statusLabel: string;
}

// --- Flight Timeline ---

export type TimelineStepStatus = "completed" | "current" | "upcoming";

export interface TimelineStep {
  id: string;
  time: string;
  label: string;
  note?: string;
  durationMinutes?: number;
  status: TimelineStepStatus;
}

// --- Wi-Fi ---

export interface AirportWifi {
  networkName: string;
  speedRating: "fast" | "moderate" | "slow";
  pricing: "free" | "paid" | "freemium";
  pricingNote?: string;
  avgSpeedMbps?: number;
}

// --- In-Flight Amenities ---

export interface InFlightAmenities {
  aircraftType: string;
  dataAvailable: boolean;
  ifeType?: string;
  powerTypes?: string[];
  ifeNote?: string;
  powerNote?: string;
}

// --- Security Queue ---

export interface HourlySlot {
  hour: number;
  estimatedWaitMinutes: number;
}

export interface SecurityQueue {
  projectedSlot: HourlySlot;
  hourlySlots: HourlySlot[];
  arrivalBufferMinutes: number;
}

// --- Restaurants ---

export interface Restaurant {
  name: string;
  cuisine: string;
  location: string;
  priceRange: string; // e.g. "£", "££", "$", "$$"
  openingHours: string;
}

export interface TerminalRestaurants {
  restaurants: Restaurant[];
}
