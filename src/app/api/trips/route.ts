import { NextRequest, NextResponse, after } from "next/server";
import { createTripSchema } from "@/lib/validation/trip-schema";
import { getSupabaseClient } from "@/lib/supabase/client";
import { syncTripToTravellerApi } from "@/lib/traveller/client";
import { getSession, getSessionCookieName, hashEmail } from "@/lib/auth/session";
import { enrichTripEntities } from "@/lib/agent/enrichment-service";

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

    return NextResponse.json({ trips: data });
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

  // 3. Check for auth_session cookie → sync to Traveller API
  const authSession = request.cookies.get("auth_session")?.value;
  let travellerResult = { synced: false, trip_id: null as string | null, error: null as string | null };

  if (authSession) {
    travellerResult = await syncTripToTravellerApi(validated, authSession);
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

  // 5. Enrich reference data in the background (non-blocking)
  after(async () => {
    await enrichTripEntities({
      flights: validated.flights_if_known,
      destination: validated.trip.destination,
    });
  });

  // 6. Return response
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
