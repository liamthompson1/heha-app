import { CREATE_TRIP_MUTATION } from "./mutations";
import { CreateTripInput } from "@/lib/validation/trip-schema";

interface TravellerResult {
  synced: boolean;
  trip_id: string | null;
  error: string | null;
}

export async function syncTripToTravellerApi(
  input: CreateTripInput,
  authSessionCookie: string
): Promise<TravellerResult> {
  const url = process.env.TRAVELLER_API_URL;
  if (!url) {
    return { synced: false, trip_id: null, error: "TRAVELLER_API_URL not configured" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_session=${authSessionCookie}`,
      },
      body: JSON.stringify({
        query: CREATE_TRIP_MUTATION,
        variables: { input },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Traveller API HTTP error:", response.status, text);
      return { synced: false, trip_id: null, error: `HTTP ${response.status}` };
    }

    const json = await response.json();

    if (json.errors?.length) {
      console.error("Traveller API GraphQL errors:", json.errors);
      return { synced: false, trip_id: null, error: json.errors[0].message };
    }

    const result = json.data?.createTrip;
    if (!result?.success) {
      return { synced: false, trip_id: null, error: result?.error ?? "Unknown error" };
    }

    return { synced: true, trip_id: result.id, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Traveller API request failed:", message);
    return { synced: false, trip_id: null, error: message };
  }
}
