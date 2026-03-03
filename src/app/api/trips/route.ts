import { NextRequest, NextResponse } from "next/server";
import { createTripSchema } from "@/lib/validation/trip-schema";
import { getSupabaseClient } from "@/lib/supabase/client";
import { syncTripToTravellerApi } from "@/lib/traveller/client";

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
      user_id: validated.user_id,
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
