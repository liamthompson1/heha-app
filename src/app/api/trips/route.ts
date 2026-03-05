import { NextRequest, NextResponse } from "next/server";
import { createTripSchema } from "@/lib/validation/trip-schema";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchTravellerTrips, mapTravellerTripToLocal, getTravellerAuthToken } from "@/lib/traveller/client";
import { createHxTripViaDockYard } from "@/lib/traveller/dock-yard";
import { getSession, getSessionCookieName, hashEmail } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const cookieValue = request.cookies.get(getSessionCookieName())?.value;
    const session = await getSession(cookieValue);

    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Derive userId from email if missing (old sessions before userId was added)
    const userId = session.userId || (session.email ? await hashEmail(session.email) : null);
    if (!userId) {
      return NextResponse.json({ error: "No user identifier in session" }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { error: `Supabase error: ${error.message}` },
        { status: 500 }
      );
    }

    let trips = data ?? [];

    // If HX-authenticated, merge trips from the Traveller API
    const authToken = getTravellerAuthToken(
      (name) => request.cookies.get(name)?.value
    );
    console.log("[Trips] hx_bearer_token present:", !!authToken, "token length:", authToken?.length ?? 0);
    if (authToken) {
      try {
        console.log("[Trips] Fetching traveller trips from:", process.env.HX_TRAVELLER_API_URL || process.env.TRAVELLER_API_URL || "NO URL SET");
        const { trips: travellerTrips, error: travellerError } =
          await fetchTravellerTrips(authToken);

        console.log("[Trips] Traveller API returned:", travellerTrips.length, "trips, error:", travellerError);

        if (travellerError) {
          console.warn("[Traveller API] Failed to fetch trips, using local only:", travellerError);
        } else if (travellerTrips.length > 0) {
          // Build a set of traveller_trip_ids already known locally
          const knownTravellerIds = new Set(
            trips
              .map((t) => t.traveller_trip_id)
              .filter(Boolean)
          );

          // Import new Traveller API trips that don't exist locally
          const newTrips = travellerTrips.filter(
            (tt) => !knownTravellerIds.has(tt.id)
          );

          if (newTrips.length > 0) {
            const inserts = newTrips.map((tt) => mapTravellerTripToLocal(tt, userId));
            const { data: inserted, error: insertError } = await supabase
              .from("trips")
              .insert(inserts)
              .select();

            if (insertError) {
              console.error("[Traveller API] Failed to import trips:", insertError);
            } else if (inserted) {
              trips = [...inserted, ...trips];
            }
          }
        }
      } catch (err) {
        // Never break the dashboard if the Traveller API is unreachable
        console.warn("[Traveller API] Unexpected error during trip merge:", err);
      }
    }

    return NextResponse.json({ trips });
  } catch (err) {
    console.error("GET /api/trips crashed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // 1. Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // 2. Validate with Zod
  const result = createTripSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: result.error.format(),
      },
      { status: 422 }
    );
  }

  const validated = result.data;

  // 2b. Use session userId if available (ensures consistency with GET)
  const cookieValue = request.cookies.get(getSessionCookieName())?.value;
  const session = await getSession(cookieValue);
  const sessionUserId = session?.userId || (session?.email ? await hashEmail(session.email) : null);
  const userId = sessionUserId || validated.user_id;

  // 3. Check for auth_token cookie → sync to Traveller API
  const authTokenForPost = getTravellerAuthToken(
    (name) => request.cookies.get(name)?.value
  );
  let travellerResult = { synced: false, trip_id: null as string | null, error: null as string | null };

  if (authTokenForPost) {
    travellerResult = await createHxTripViaDockYard(validated, authTokenForPost);
  }

  // 4. Save to Supabase
  const supabase = getSupabaseClient();
  const { data: trip, error: dbError } = await supabase
    .from("trips")
    .insert({
      user_id: userId,
      trip: validated.trip,
      people_travelling: validated.people_travelling,
      preferences: validated.preferences,
      flights_if_known: validated.flights_if_known,
      journey_locations: validated.journey_locations,
      anything_else_we_should_know: validated.anything_else_we_should_know ?? null,
      traveller_api_synced: travellerResult.synced,
      traveller_trip_id: travellerResult.trip_id,
    })
    .select()
    .single();

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return NextResponse.json(
      { error: "Failed to save trip" },
      { status: 500 }
    );
  }

  // 5. Return response
  return NextResponse.json(
    {
      trip,
      traveller_api: {
        synced: travellerResult.synced,
        trip_id: travellerResult.trip_id,
        error: travellerResult.error,
      },
    },
    { status: 201 }
  );
}
