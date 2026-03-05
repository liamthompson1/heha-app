import { CreateTripInput } from "@/lib/validation/trip-schema";
import { TravellerResult } from "./client";

const DOCK_YARD_URL =
  "https://www.holidayextras.com/dock-yard/html-form-target/trips/create-with-flights";

/**
 * Create a trip via the HX dock-yard POST endpoint (replaces GraphQL sync).
 * Sends flight references and trip params as form-style POST.
 * Only call for authenticated HX users.
 */
export async function createHxTripViaDockYard(
  input: CreateTripInput,
  authSessionCookie: string
): Promise<TravellerResult> {
  // Extract flight references from first (outbound) and second (inbound) flights
  const outboundRef = input.flights_if_known?.[0]?.flight_reference || "";
  const inboundRef = input.flights_if_known?.[1]?.flight_reference || "";

  const params = new URLSearchParams({
    outboundFlightReference: outboundRef,
    inboundFlightReference: inboundRef,
    productTypePreferences: "",
    productPreferenceCarparkOutboundFlightOffsetHours: "3",
    productPreferenceCarparkInboundFlightOffsetHours: "1",
    referrer: "heha_search_new",
    agent: "VOUC1",
  });

  const url = `${DOCK_YARD_URL}?${params.toString()}`;
  console.log("[HX Dock-Yard] Creating trip:", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Cookie: `auth_session=${authSessionCookie}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      redirect: "manual",
    });

    // The dock-yard typically redirects with the trip ID in the Location header
    const location = response.headers.get("location");
    let tripId: string | null = null;

    if (location) {
      // Extract trip ID from redirect URL (e.g. /trips/abc-123)
      const match = location.match(/\/trips\/([^/?]+)/);
      tripId = match?.[1] ?? null;
    }

    // If no redirect, try to parse body for trip ID
    if (!tripId && response.ok) {
      try {
        const text = await response.text();
        // Try to extract trip ID from response body
        const bodyMatch = text.match(/["']?(?:trip_?id|tripId)["']?\s*[:=]\s*["']?([a-zA-Z0-9-]+)["']?/);
        tripId = bodyMatch?.[1] ?? null;
      } catch {
        // Body parsing is best-effort
      }
    }

    if (tripId) {
      console.log("[HX Dock-Yard] Trip created successfully:", tripId);
      return { synced: true, trip_id: tripId, error: null };
    }

    // Accept 2xx or 3xx as success even without extractable trip ID
    if (response.status >= 200 && response.status < 400) {
      console.log("[HX Dock-Yard] Request accepted (status", response.status, ") but no trip ID extracted");
      return { synced: true, trip_id: null, error: null };
    }

    const errorText = await response.text().catch(() => "");
    console.error("[HX Dock-Yard] Failed:", response.status, errorText.slice(0, 200));
    return { synced: false, trip_id: null, error: `Dock-yard returned ${response.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[HX Dock-Yard] Request failed:", message);
    return { synced: false, trip_id: null, error: message };
  }
}
