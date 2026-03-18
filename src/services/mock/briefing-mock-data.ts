import type {
  BriefingFlight,
  OnTimeStats,
  WeatherComparison,
  GateInfo,
  AircraftDetails,
  InboundFlight,
  TimelineStep,
  AirportWifi,
  InFlightAmenities,
  SecurityQueue,
  TerminalRestaurants,
} from "@/types/briefing";

export const MOCK_FLIGHT: BriefingFlight = {
  flightNumber: "FR8576",
  airline: "Ryanair",
  airlineLogo: null,
  alliance: null,
  checkInUrl: null,
  aircraftType: "Boeing 737-800",
  departure: {
    iata: "MAN",
    name: "Manchester Airport",
    city: "Manchester",
    terminal: "T3",
  },
  arrival: {
    iata: "BCN",
    name: "Barcelona–El Prat",
    city: "Barcelona",
    terminal: "T2B",
  },
  scheduledDepartureTime: "2026-04-12T06:30:00+01:00",
  scheduledArrivalTime: "2026-04-12T10:00:00+02:00",
  isHub: { departure: false, arrival: false },
};

export const MOCK_ON_TIME: OnTimeStats = {
  onTimePercentage: 74,
  avgDelayMinutesWhenLate: 32,
  periodDays: 30,
  sampleSize: 28,
  breakdown: {
    earlyPercent: 12,
    onTimePercent: 62,
    lateUnder1hrPercent: 18,
    lateOver1hrPercent: 6,
    cancelledPercent: 2,
  },
};

export const MOCK_WEATHER: WeatherComparison = {
  departure: {
    airportIata: "MAN",
    city: "Manchester",
    tempCelsius: 8,
    condition: "cloudy",
    rainChancePercent: 55,
    packingHint: "Bring a waterproof jacket",
  },
  arrival: {
    airportIata: "BCN",
    city: "Barcelona",
    tempCelsius: 18,
    condition: "sunny",
    rainChancePercent: 10,
    packingHint: "Sunglasses recommended",
  },
  forecastLabel: "Average for mid-April",
};

export const MOCK_GATE_INFO: GateInfo = {
  flightStatus: "on-time",
  departureGate: null,
  departureGateNote: "Assigned ~2h before departure",
  arrivalTerminal: "T2B",
  baggageCarousel: null,
  baggageNote: "Updated on landing",
};

export const MOCK_AIRCRAFT: AircraftDetails = {
  aircraftType: "Boeing 737-800",
  tailNumber: "EI-FRD",
  ageYears: 6.2,
  seatCount: 189,
  seatConfig: "Single class",
  note: "The 737-800 is Ryanair's workhorse — over 450 in their fleet",
};

export const MOCK_INBOUND: InboundFlight = {
  flightNumber: "FR8575",
  origin: "BCN",
  destination: "MAN",
  scheduledArrival: "2026-04-11T22:45:00+01:00",
  status: "scheduled",
  statusLabel: "Your aircraft arrives tonight",
};

export const MOCK_TIMELINE: TimelineStep[] = [
  { id: "arrive", time: "04:30", label: "Arrive at airport", note: "2h before departure", status: "upcoming" },
  { id: "checkin", time: "04:40", label: "Check-in & bag drop", durationMinutes: 15, status: "upcoming" },
  { id: "security", time: "05:00", label: "Security", durationMinutes: 12, status: "upcoming" },
  { id: "gate", time: "05:30", label: "Gate opens", note: "Gate TBD", status: "upcoming" },
  { id: "boarding", time: "06:00", label: "Boarding", durationMinutes: 25, status: "upcoming" },
  { id: "takeoff", time: "06:30", label: "Takeoff", note: "MAN → BCN", status: "upcoming" },
  { id: "landing", time: "10:00", label: "Landing", note: "Barcelona–El Prat", status: "upcoming" },
  { id: "baggage", time: "10:20", label: "Baggage claim", note: "Carousel TBD", status: "upcoming" },
];

export const MOCK_WIFI: AirportWifi = {
  networkName: "_Free_WiFi_MAN",
  speedRating: "moderate",
  pricing: "freemium",
  pricingNote: "Free for 60 min, then £3.95/hr",
  avgSpeedMbps: 12,
};

export const MOCK_AMENITIES: InFlightAmenities = {
  aircraftType: "Boeing 737-800",
  dataAvailable: true,
  ifeType: "No seatback screens",
  powerTypes: ["USB-A"],
  ifeNote: "Ryanair doesn't offer IFE — bring your own device",
  powerNote: "USB-A ports available on newer 737-800 configurations",
};

export const MOCK_SECURITY_QUEUE: SecurityQueue = {
  projectedSlot: { hour: 4, estimatedWaitMinutes: 12 },
  hourlySlots: Array.from({ length: 24 }, (_, hour) => {
    const waitTimes: Record<number, number> = {
      0: 2, 1: 2, 2: 2, 3: 5, 4: 12, 5: 25, 6: 35, 7: 30,
      8: 22, 9: 18, 10: 15, 11: 14, 12: 16, 13: 20, 14: 22,
      15: 25, 16: 28, 17: 18, 18: 14, 19: 10, 20: 8, 21: 5,
      22: 3, 23: 2,
    };
    return { hour, estimatedWaitMinutes: waitTimes[hour] };
  }),
  arrivalBufferMinutes: 120,
};

export const MOCK_RESTAURANTS: TerminalRestaurants = {
  restaurants: [
    { name: "Archie's", cuisine: "Burgers & Shakes", location: "After security, Gate 52", priceRange: "££", openingHours: "04:00–21:00" },
    { name: "Caffè Nero", cuisine: "Coffee & Pastries", location: "After security, main concourse", priceRange: "£", openingHours: "04:00–20:00" },
    { name: "The Bridgewater", cuisine: "Pub & Grill", location: "After security, Gate 54", priceRange: "££", openingHours: "04:00–22:00" },
    { name: "Tampopo", cuisine: "Pan-Asian", location: "After security, Gate 50", priceRange: "££", openingHours: "05:00–20:00" },
    { name: "Pret A Manger", cuisine: "Sandwiches & Coffee", location: "Before security, check-in hall", priceRange: "£", openingHours: "03:30–21:00" },
  ],
};
