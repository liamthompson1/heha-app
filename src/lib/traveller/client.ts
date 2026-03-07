import {
  CREATE_TRIP_MUTATION,
  GET_TRAVELLER_TRIPS_QUERY,
  EDIT_TRIP_MUTATION,
  ARCHIVE_TRIP_MUTATION,
  INTROSPECTION_QUERY,
} from "./mutations";
import { CreateTripInput } from "@/lib/validation/trip-schema";
import { TripRow } from "@/types/trip";

export interface TravellerResult {
  synced: boolean;
  trip_id: string | null;
  error: string | null;
}

/** Shape of a Trip as returned by the Traveller API */
export interface TravellerTrip {
  id: string;
  name?: string;
  from: string;       // ISO date — trip start
  to?: string;        // ISO date — trip end
  departureIATA?: string;
  destinationIATA?: string;
  storedAt: string;    // when created
  travellers?: {
    travellerCount?: number;
  };
  outboundOriginPostCode?: string;
}

/**
 * Read the HX auth token from request cookies.
 * Checks multiple cookie sources in priority order:
 *  1. auth_session — original HX cookie (if browser somehow has it)
 *  2. hx_auth_session — auth_session value extracted and stored by our OTP flow
 *  3. hx_bearer_token — firebaseToken from OTP response
 * Returns null if not present (guest user).
 */
export function getTravellerAuthToken(
  getCookie: (name: string) => string | undefined
): string | null {
  return getCookie("auth_session") ?? getCookie("hx_auth_session") ?? getCookie("hx_bearer_token") ?? null;
}

function getTravellerApiUrls(): string[] {
  const urls: string[] = [];
  if (process.env.HX_TRAVELLER_API_URL) urls.push(process.env.HX_TRAVELLER_API_URL);
  if (process.env.TRAVELLER_API_URL) urls.push(process.env.TRAVELLER_API_URL);
  return urls;
}

async function graphqlRequest(
  query: string,
  variables: Record<string, unknown>,
  authToken: string
): Promise<{ data?: Record<string, unknown>; errors?: { message: string }[] }> {
  const urls = getTravellerApiUrls();
  if (urls.length === 0) {
    throw new Error("TRAVELLER_API_URL not configured");
  }

  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          Cookie: `auth_session=${authToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const text = await response.text();
        lastError = new Error(`HTTP ${response.status} from ${url}: ${text.slice(0, 200)}`);
        console.warn(`[Traveller API] ${url} returned ${response.status}, trying next...`);
        continue;
      }

      const json = await response.json();

      // If we get auth errors in the GraphQL response and have another URL, try it
      if (json.errors?.length && urls.indexOf(url) < urls.length - 1) {
        const msg = json.errors[0].message?.toLowerCase() ?? "";
        if (msg.includes("auth") || msg.includes("unauth") || msg.includes("forbidden") || msg.includes("not logged in")) {
          console.warn(`[Traveller API] ${url} auth error: ${json.errors[0].message}, trying next...`);
          lastError = new Error(json.errors[0].message);
          continue;
        }
      }

      return json;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Traveller API] ${url} failed: ${lastError.message}, trying next...`);
      continue;
    }
  }

  throw lastError ?? new Error("All Traveller API URLs failed");
}

// --- Introspection ---

export async function introspectTravellerSchema(
  authSessionCookie: string
): Promise<{ data?: unknown; error?: string }> {
  try {
    const json = await graphqlRequest(INTROSPECTION_QUERY, {}, authSessionCookie);

    if (json.errors?.length) {
      return { error: json.errors[0].message };
    }

    return { data: json.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Traveller API introspection failed:", message);
    return { error: message };
  }
}

// --- Create Trip ---

export async function syncTripToTravellerApi(
  input: CreateTripInput,
  authSessionCookie: string
): Promise<TravellerResult> {
  if (getTravellerApiUrls().length === 0) {
    return { synced: false, trip_id: null, error: "TRAVELLER_API_URL not configured" };
  }

  // Map local CreateTripInput → Traveller API TripInput
  const tripInput: Record<string, unknown> = {
    fromDate: input.trip.start_date,
    toDate: input.trip.end_date,
    name: input.trip.destination,
    type: input.trip.trip_type,
  };

  // Map traveller count
  if (input.people_travelling?.length) {
    tripInput.travellers = {
      adultCount: input.people_travelling.length,
    };
  }

  // Map flight skeletons if available
  if (input.flights_if_known?.length) {
    const outbound = input.flights_if_known[0];
    if (outbound) {
      tripInput.outboundFlightSkeleton = {
        code: outbound.flight_number || undefined,
        departureIATA: outbound.departure_airport,
        arrivalIATA: outbound.arrival_airport,
        departureSchedule: outbound.departure_time ? { dateTime: outbound.departure_time } : undefined,
        arrivalSchedule: outbound.arrival_time ? { dateTime: outbound.arrival_time } : undefined,
      };
    }

    if (input.flights_if_known.length > 1) {
      const inbound = input.flights_if_known[1];
      tripInput.inboundFlightSkeleton = {
        code: inbound.flight_number || undefined,
        departureIATA: inbound.departure_airport,
        arrivalIATA: inbound.arrival_airport,
        departureSchedule: inbound.departure_time ? { dateTime: inbound.departure_time } : undefined,
        arrivalSchedule: inbound.arrival_time ? { dateTime: inbound.arrival_time } : undefined,
      };
    }
  }

  console.log("[Traveller API] CreateTrip - sending trip input:", JSON.stringify(tripInput, null, 2));

  try {
    const json = await graphqlRequest(
      CREATE_TRIP_MUTATION,
      { trip: tripInput },
      authSessionCookie
    );

    console.log("[Traveller API] CreateTrip - response:", JSON.stringify(json, null, 2));

    if (json.errors?.length) {
      console.error("[Traveller API] CreateTrip GraphQL errors:", json.errors);
      return { synced: false, trip_id: null, error: json.errors[0].message };
    }

    // CreateTripResponse is a union — on success it returns a Trip with an id
    const result = (json.data as Record<string, unknown>)?.createTrip as
      | { id?: string; message?: string }
      | undefined;

    if (result?.message) {
      // TripCreationError branch
      return { synced: false, trip_id: null, error: result.message };
    }

    if (result?.id) {
      return { synced: true, trip_id: result.id, error: null };
    }

    return { synced: false, trip_id: null, error: "No trip ID returned" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Traveller API] CreateTrip request failed:", message);
    return { synced: false, trip_id: null, error: message };
  }
}

// --- Fetch Trips ---

export async function fetchTravellerTrips(
  authSessionCookie: string
): Promise<{ trips: TravellerTrip[]; error: string | null }> {
  try {
    const json = await graphqlRequest(GET_TRAVELLER_TRIPS_QUERY, {}, authSessionCookie);

    if (json.errors?.length) {
      console.error("[Traveller API] GetTravellerTrips GraphQL errors:", json.errors);
      return { trips: [], error: json.errors[0].message };
    }

    const traveller = (json.data as Record<string, unknown>)?.getTraveller as
      | { upcomingTrips?: TravellerTrip[] }
      | undefined;

    const trips = traveller?.upcomingTrips ?? [];

    return { trips, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Traveller API] GetTravellerTrips request failed:", message);
    return { trips: [], error: message };
  }
}

// --- Edit Trip ---

export async function updateTripInTravellerApi(
  tripId: string,
  localUpdates: Record<string, unknown>,
  authSessionCookie: string
): Promise<TravellerResult> {
  if (getTravellerApiUrls().length === 0) {
    return { synced: false, trip_id: null, error: "TRAVELLER_API_URL not configured" };
  }

  // Map local update fields → TripAmendment shape
  const fields: Record<string, unknown> = {};
  const trip = localUpdates.trip as Record<string, unknown> | undefined;
  if (trip) {
    if (trip.destination) fields.name = trip.destination;
    if (trip.start_date) fields.fromDate = trip.start_date;
    if (trip.end_date) fields.toDate = trip.end_date;
    if (trip.trip_type) fields.type = trip.trip_type;
  }

  if (localUpdates.people_travelling) {
    const people = localUpdates.people_travelling as unknown[];
    fields.travellers = { adultCount: people.length };
  }

  try {
    const json = await graphqlRequest(
      EDIT_TRIP_MUTATION,
      { tripId, fields },
      authSessionCookie
    );

    if (json.errors?.length) {
      console.error("[Traveller API] EditTrip GraphQL errors:", json.errors);
      return { synced: false, trip_id: tripId, error: json.errors[0].message };
    }

    const result = (json.data as Record<string, unknown>)?.editTrip as
      | { id?: string }
      | undefined;

    return { synced: true, trip_id: result?.id ?? tripId, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Traveller API] EditTrip request failed:", message);
    return { synced: false, trip_id: tripId, error: message };
  }
}

// --- Archive (Delete) Trip ---

export async function deleteTripFromTravellerApi(
  tripId: string,
  authSessionCookie: string
): Promise<TravellerResult> {
  if (getTravellerApiUrls().length === 0) {
    return { synced: false, trip_id: null, error: "TRAVELLER_API_URL not configured" };
  }

  try {
    const json = await graphqlRequest(
      ARCHIVE_TRIP_MUTATION,
      { tripId },
      authSessionCookie
    );

    if (json.errors?.length) {
      console.error("[Traveller API] ArchiveTrip GraphQL errors:", json.errors);
      return { synced: false, trip_id: tripId, error: json.errors[0].message };
    }

    // archiveTrip returns Boolean
    const archived = (json.data as Record<string, unknown>)?.archiveTrip;
    if (archived === false) {
      return { synced: false, trip_id: tripId, error: "Archive returned false" };
    }

    return { synced: true, trip_id: tripId, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Traveller API] ArchiveTrip request failed:", message);
    return { synced: false, trip_id: tripId, error: message };
  }
}

// --- Mapping helper: Traveller API Trip → local TripRow shape ---

/** Normalize full ISO datetime to YYYY-MM-DD */
function toDateOnly(iso: string): string {
  return iso.includes("T") ? iso.split("T")[0] : iso;
}

export function mapTravellerTripToLocal(
  travellerTrip: TravellerTrip,
  userId: string
): Omit<TripRow, "id" | "created_at"> {
  // Extract destination city from route name like "Gatwick to Amsterdam Schiphol"
  let destination = travellerTrip.name || "";
  if (destination.toLowerCase().includes(" to ")) {
    destination = destination.split(/ to /i).pop()!.trim();
  }
  destination = destination || travellerTrip.destinationIATA || "Unknown";

  const startDate = toDateOnly(travellerTrip.from);
  const endDate = toDateOnly(travellerTrip.to ?? travellerTrip.from);

  // Build flight skeletons from IATA codes if both are available
  const flights: { departure_airport: string; arrival_airport: string; departure_date?: string }[] = [];
  if (travellerTrip.departureIATA && travellerTrip.destinationIATA) {
    flights.push({
      departure_airport: travellerTrip.departureIATA,
      arrival_airport: travellerTrip.destinationIATA,
      departure_date: startDate,
    });
    flights.push({
      departure_airport: travellerTrip.destinationIATA,
      arrival_airport: travellerTrip.departureIATA,
      departure_date: endDate,
    });
  }

  return {
    user_id: userId,
    trip: {
      destination,
      start_date: startDate,
      end_date: endDate,
    },
    people_travelling: travellerTrip.travellers?.travellerCount
      ? Array.from({ length: travellerTrip.travellers.travellerCount }, (_, i) => ({
          name: `Traveller ${i + 1}`,
        }))
      : [{ name: "Traveller 1" }],
    preferences: {},
    flights_if_known: flights,
    journey_locations: {
      origin: travellerTrip.outboundOriginPostCode,
    },
    traveller_api_synced: true,
    traveller_trip_id: travellerTrip.id,
  };
}
