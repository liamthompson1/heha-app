import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchFlightStatus, FlightStatusResult } from "@/lib/agent/flight-fetcher";
import { fetchCountryData, CountryData } from "@/lib/agent/country-fetcher";
import { fetchTravelAdvisory, TravelAdvisoryData } from "@/lib/agent/advisory-fetcher";
import type { Airport, Airline, Destination } from "@/types/reference-data";
import type { TripRow, ApiFlight } from "@/types/trip";
import type {
  BriefingData,
  BriefingFlight,
  GateInfo,
  AircraftDetails,
  TimelineStep,
  SecurityQueue,
  AirportWifi,
  InFlightAmenities,
  WeatherComparison,
  AirportWeather,
  DestinationInfo,
  FlightStatus,
} from "@/types/briefing";

// ─── Helpers ────────────────────────────────────────────────

function formatTimeHHMM(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function subtractMinutes(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - minutes);
  return formatTimeHHMM(d.toISOString());
}

/** Try to find which terminal an airline operates from at an airport */
function matchTerminal(airport: Airport | null, airlineIata: string): string | undefined {
  if (!airport?.terminal_info?.length || !airlineIata) return undefined;
  for (const t of airport.terminal_info) {
    if (t.airlines?.some((a) => a.toUpperCase().includes(airlineIata.toUpperCase()))) {
      return t.name;
    }
  }
  return undefined;
}

// ─── Supabase Lookups ───────────────────────────────────────

async function lookupAirport(iata: string): Promise<Airport | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("airports")
    .select("*")
    .eq("iata_code", iata)
    .single();
  return data as Airport | null;
}

async function lookupAirline(iata: string): Promise<Airline | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("airlines")
    .select("*")
    .eq("iata_code", iata)
    .single();
  return data as Airline | null;
}

async function lookupDestination(city: string): Promise<Destination | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("destinations")
    .select("*")
    .ilike("city", city)
    .limit(1)
    .single();
  return data as Destination | null;
}

// ─── Card Builders ──────────────────────────────────────────

function buildFlight(
  f: ApiFlight,
  tripStartDate: string,
  depAirport: Airport | null,
  arrAirport: Airport | null,
  airline: Airline | null,
  flightStatus: FlightStatusResult | null
): BriefingFlight {
  const depIso = f.departure_time || `${tripStartDate}T00:00`;
  const arrIso = f.arrival_time || depIso;
  const airlineCode = f.airline?.substring(0, 2) || "";

  // Terminal: prefer AeroDataBox live data, then match from terminal_info DB
  const depTerminal =
    flightStatus?.departureTerminal ??
    matchTerminal(depAirport, airlineCode) ??
    undefined;
  const arrTerminal =
    flightStatus?.arrivalTerminal ??
    matchTerminal(arrAirport, airlineCode) ??
    undefined;

  const hubs = airline?.hub_airports ?? [];

  return {
    flightNumber: f.flight_number || "TBD",
    airline: airline?.name || f.airline || "Unknown Airline",
    airlineLogo: airline?.logo_url ?? null,
    alliance: airline?.alliance ?? null,
    checkInUrl: airline?.website ? `${airline.website.replace(/\/$/, "")}` : null,
    aircraftType: flightStatus?.aircraftType || "Unknown",
    departure: {
      iata: f.departure_airport,
      name: depAirport?.name || f.departure_airport,
      city: depAirport?.city || f.departure_airport,
      terminal: depTerminal,
    },
    arrival: {
      iata: f.arrival_airport,
      name: arrAirport?.name || f.arrival_airport,
      city: arrAirport?.city || f.arrival_airport,
      terminal: arrTerminal,
    },
    scheduledDepartureTime: depIso,
    scheduledArrivalTime: arrIso,
    isHub: {
      departure: hubs.includes(f.departure_airport),
      arrival: hubs.includes(f.arrival_airport),
    },
  };
}

function buildGateInfo(flightStatus: FlightStatusResult | null): GateInfo | null {
  if (!flightStatus) return null;

  let status: FlightStatus = "on-time";
  if (flightStatus.status === "cancelled") status = "cancelled";

  return {
    flightStatus: status,
    departureGate: flightStatus.departureGate,
    departureGateNote: flightStatus.departureGate ? undefined : "Assigned ~2h before departure",
    arrivalTerminal: flightStatus.arrivalTerminal,
    baggageCarousel: flightStatus.baggageCarousel,
    baggageNote: flightStatus.baggageCarousel ? undefined : "Updated on landing",
  };
}

function buildAircraft(flightStatus: FlightStatusResult | null): AircraftDetails | null {
  if (!flightStatus?.aircraftType) return null;

  return {
    aircraftType: flightStatus.aircraftType,
    tailNumber: flightStatus.aircraftRegistration,
    ageYears: null,
    seatCount: null,
    seatConfig: null,
    note: `Aircraft: ${flightStatus.aircraftType}`,
  };
}

function buildTimeline(
  flight: BriefingFlight,
  securityMinutes: number,
  depAirport: Airport | null
): TimelineStep[] {
  const depTime = flight.scheduledDepartureTime;
  const arrTime = flight.scheduledArrivalTime;
  const bufferMinutes = 120;

  const terminalNote = flight.departure.terminal
    ? `Terminal ${flight.departure.terminal}`
    : "Gate TBD";

  // Use airport timezone in the note if available
  const tzNote = depAirport?.timezone ? ` (${depAirport.timezone})` : "";

  return [
    {
      id: "arrive",
      time: subtractMinutes(depTime, bufferMinutes),
      label: "Arrive at airport",
      note: `2h before departure${tzNote}`,
      status: "upcoming",
    },
    {
      id: "checkin",
      time: subtractMinutes(depTime, bufferMinutes - 10),
      label: "Check-in & bag drop",
      durationMinutes: 15,
      status: "upcoming",
    },
    {
      id: "security",
      time: subtractMinutes(depTime, 90),
      label: "Security",
      durationMinutes: securityMinutes,
      status: "upcoming",
    },
    {
      id: "gate",
      time: subtractMinutes(depTime, 60),
      label: "Gate opens",
      note: terminalNote,
      status: "upcoming",
    },
    {
      id: "boarding",
      time: subtractMinutes(depTime, 30),
      label: "Boarding",
      durationMinutes: 25,
      status: "upcoming",
    },
    {
      id: "takeoff",
      time: formatTimeHHMM(depTime),
      label: "Takeoff",
      note: `${flight.departure.iata} → ${flight.arrival.iata}`,
      status: "upcoming",
    },
    {
      id: "landing",
      time: formatTimeHHMM(arrTime),
      label: "Landing",
      note: flight.arrival.name,
      status: "upcoming",
    },
    {
      id: "baggage",
      time: subtractMinutes(arrTime, -20),
      label: "Baggage claim",
      note: "Carousel TBD",
      status: "upcoming",
    },
  ];
}

function buildSecurity(depAirport: Airport | null): SecurityQueue | null {
  if (!depAirport?.tsa_wait_avg_minutes) return null;

  const avg = depAirport.tsa_wait_avg_minutes;
  const hourlySlots = Array.from({ length: 24 }, (_, hour) => {
    const peakMultiplier =
      hour >= 5 && hour <= 8 ? 1.8 :
      hour >= 14 && hour <= 17 ? 1.5 :
      hour >= 0 && hour <= 3 ? 0.2 :
      1.0;
    return {
      hour,
      estimatedWaitMinutes: Math.round(avg * peakMultiplier),
    };
  });

  return {
    projectedSlot: hourlySlots[6],
    hourlySlots,
    arrivalBufferMinutes: 120,
    tips: depAirport.security_tips,
  };
}

function buildWifi(depAirport: Airport | null): AirportWifi | null {
  if (!depAirport || depAirport.wifi_available === null) return null;
  if (!depAirport.wifi_available) return null;

  const quality = depAirport.wifi_quality?.toLowerCase() || "moderate";
  const speedRating: AirportWifi["speedRating"] =
    quality.includes("fast") ? "fast" :
    quality.includes("slow") ? "slow" :
    "moderate";

  return {
    networkName: `WiFi_${depAirport.iata_code}`,
    speedRating,
    pricing: "free",
    pricingNote: depAirport.wifi_quality || undefined,
  };
}

function buildAmenities(
  airline: Airline | null,
  aircraftType: string
): InFlightAmenities | null {
  if (!airline?.fleet_info || Object.keys(airline.fleet_info).length === 0) return null;

  const info = airline.fleet_info as Record<string, unknown>;

  return {
    aircraftType,
    dataAvailable: true,
    ifeType: (info.ife_type as string) || undefined,
    powerTypes: (info.power_types as string[]) || undefined,
    ifeNote: (info.ife_note as string) || undefined,
    powerNote: (info.power_note as string) || undefined,
  };
}

function buildWeather(
  destination: Destination | null,
  depAirport: Airport | null,
  arrAirport: Airport | null,
  tripMonth: number
): WeatherComparison | null {
  if (!destination?.weather_averages?.length) return null;

  // weather_averages is an array — try to find the matching month
  const averages = destination.weather_averages as Array<{
    month?: number;
    temp_high_c?: number;
    temp_low_c?: number;
    rain_chance_percent?: number;
    condition?: string;
  }>;

  const monthData = averages.find((w) => w.month === tripMonth) ?? averages[0];
  if (!monthData) return null;

  const avgTemp = monthData.temp_high_c != null && monthData.temp_low_c != null
    ? Math.round((monthData.temp_high_c + monthData.temp_low_c) / 2)
    : monthData.temp_high_c ?? 20;

  const condition = (monthData.condition || "partly-cloudy") as AirportWeather["condition"];
  const rainChance = monthData.rain_chance_percent ?? 30;

  // Departure weather — we don't have real data, show a simpler view
  const depCity = depAirport?.city || "Departure";
  const arrCity = arrAirport?.city || destination.city;

  return {
    departure: {
      airportIata: depAirport?.iata_code || "DEP",
      city: depCity,
      tempCelsius: avgTemp, // best we can do without a weather API
      condition: "partly-cloudy",
      rainChancePercent: 50,
      packingHint: "Check forecast closer to travel",
    },
    arrival: {
      airportIata: arrAirport?.iata_code || "ARR",
      city: arrCity,
      tempCelsius: avgTemp,
      condition,
      rainChancePercent: rainChance,
      packingHint: rainChance > 40 ? "Pack an umbrella" : "Light layers recommended",
    },
    forecastLabel: `Historical averages for ${new Date(0, tripMonth - 1).toLocaleString("en", { month: "long" })}`,
  };
}

function buildDestinationInfo(
  destination: Destination | null,
  countryData: CountryData | null,
  advisory: TravelAdvisoryData | null,
  arrAirport: Airport | null,
  tripMonth: number,
  fallbackCity?: string
): DestinationInfo | null {
  // Show the card if we have any source of data, or at minimum a city name
  if (!destination && !countryData && !fallbackCity) return null;

  // Currency: prefer DB (populated by enrichment), fall back to live API
  const dbCurrency = destination?.currency_code
    ? `${destination.currency_code}${destination.currency_name ? ` (${destination.currency_name})` : ""}`
    : null;
  const currency = dbCurrency ?? countryData?.currency ?? null;

  // Languages: prefer DB, fall back to live API
  const languages =
    destination?.languages?.length
      ? destination.languages
      : destination?.primary_language
        ? [destination.primary_language]
        : countryData?.languages ?? [];

  // Travel advisories: prefer State Dept API, fall back to DB
  const advisories = advisory
    ? [{ level: `Level ${advisory.level}`, description: advisory.levelLabel }]
    : (destination?.travel_advisories ?? []).map((a) => ({
        level: a.level,
        description: a.description,
      }));

  // Determine season note from popular_seasons
  let seasonNote: string | null = null;
  if (destination?.popular_seasons?.length) {
    const monthName = new Date(0, tripMonth - 1).toLocaleString("en", { month: "long" }).toLowerCase();
    const isPopular = destination.popular_seasons.some(
      (s) => s.toLowerCase().includes(monthName)
    );
    seasonNote = isPopular ? "Popular travel season" : "Off-peak season — fewer crowds";
  }

  return {
    city: destination?.city ?? arrAirport?.city ?? fallbackCity ?? "Unknown",
    country: destination?.country ?? countryData?.countryName ?? "Unknown",
    description: destination?.description ?? null,
    currency,
    languages,
    travelAdvisories: advisories,
    seasonNote,
    flagUrl: destination?.flag_url ?? countryData?.flagUrl ?? null,
    timezone: destination?.timezone ?? countryData?.timezone ?? null,
    drivingSide: destination?.driving_side ?? countryData?.drivingSide ?? null,
    callingCode: destination?.calling_code ?? countryData?.callingCode ?? null,
    population: destination?.population ?? countryData?.population ?? null,
    region: destination?.region ?? countryData?.subregion ?? countryData?.region ?? null,
  };
}

// ─── Main Assembler ─────────────────────────────────────────

export async function assembleBriefing(trip: TripRow): Promise<BriefingData | null> {
  const flights = trip.flights_if_known;
  const f = flights?.[0] ?? null;
  const tripStartDate = trip.trip.start_date;
  const tripMonth = new Date(tripStartDate).getMonth() + 1;
  const destinationCity = trip.trip.destination;

  // If there are no flights and no destination, nothing to show
  if (!f && !destinationCity) return null;

  const airlineCode = f?.airline?.substring(0, 2) || "";
  const flightDate = f?.departure_time
    ? f.departure_time.substring(0, 10)
    : tripStartDate;

  // Parallel fetches — only fire flight-related ones when we have a flight
  const [depAirport, arrAirport, airline, flightStatus, destination] = await Promise.all([
    f ? lookupAirport(f.departure_airport) : Promise.resolve(null),
    f ? lookupAirport(f.arrival_airport) : Promise.resolve(null),
    f && airlineCode ? lookupAirline(airlineCode) : Promise.resolve(null),
    f?.flight_number && flightDate
      ? fetchFlightStatus(f.flight_number, flightDate)
      : Promise.resolve(null),
    destinationCity ? lookupDestination(destinationCity) : Promise.resolve(null),
  ]);

  // Derive country name — try airport DB, then destination DB, then parse "City, Country" format
  const destinationParts = destinationCity?.split(",").map((s) => s.trim());
  const countryName =
    arrAirport?.country ??
    destination?.country ??
    (destinationParts && destinationParts.length >= 2
      ? destinationParts[destinationParts.length - 1]
      : destinationCity) ??
    null;

  // REST Countries + Travel Advisory — run in parallel
  const [countryData, advisory] = await Promise.all([
    countryName ? fetchCountryData(countryName) : Promise.resolve(null),
    countryName ? fetchTravelAdvisory(countryName) : Promise.resolve(null),
  ]);

  const flight = f
    ? buildFlight(f, tripStartDate, depAirport, arrAirport, airline, flightStatus)
    : null;
  const securityMinutes = depAirport?.tsa_wait_avg_minutes ?? 15;

  return {
    flight,
    timeline: flight ? buildTimeline(flight, securityMinutes, depAirport) : [],
    weather: buildWeather(destination, depAirport, arrAirport, tripMonth),
    gateInfo: buildGateInfo(flightStatus),
    onTime: null,
    inbound: null,
    aircraft: buildAircraft(flightStatus),
    security: buildSecurity(depAirport),
    wifi: buildWifi(depAirport),
    amenities: flight ? buildAmenities(airline, flight.aircraftType) : null,
    restaurants: null,
    destination: buildDestinationInfo(destination, countryData, advisory, arrAirport, tripMonth, destinationParts?.[0]),
  };
}
