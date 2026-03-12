import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { updateTripInTravellerApi, deleteTripFromTravellerApi, getTravellerAuthToken } from "@/lib/traveller/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json({ trip: data }, {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const supabase = getSupabaseClient();

  // Verify trip exists
  const { data: existing, error: fetchError } = await supabase
    .from("trips")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Build update payload — only update provided fields
  const updates: Record<string, unknown> = {};
  if (body.trip) updates.trip = body.trip;
  if (body.people_travelling) updates.people_travelling = body.people_travelling;
  if (body.preferences) updates.preferences = body.preferences;
  if (body.flights_if_known !== undefined) updates.flights_if_known = body.flights_if_known;
  if (body.journey_locations) updates.journey_locations = body.journey_locations;
  if (body.anything_else_we_should_know !== undefined)
    updates.anything_else_we_should_know = body.anything_else_we_should_know;

  // Clear cached content if destination changed (will be regenerated)
  if (body.trip?.destination) {
    updates.trip_content = null;
  }

  const { data, error } = await supabase
    .from("trips")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Trip update error:", error);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }

  // Sync update to Traveller API if applicable
  const authToken = getTravellerAuthToken(
    (name) => request.cookies.get(name)?.value
  );
  if (authToken && data.traveller_trip_id) {
    const syncResult = await updateTripInTravellerApi(
      data.traveller_trip_id,
      updates,
      authToken
    );
    if (syncResult.error) {
      console.warn("[Traveller API] Update sync failed (non-blocking):", syncResult.error);
    }
  }

  return NextResponse.json({ trip: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = getSupabaseClient();

  // Fetch the trip first so we can check for traveller_trip_id before deleting
  const { data: trip } = await supabase
    .from("trips")
    .select("traveller_trip_id")
    .eq("id", id)
    .single();

  // Delete the trip's image from storage if it exists
  await supabase.storage.from("trip-images").remove([`trips/${id}.png`, `trips/${id}.jpg`]);

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Trip delete error:", error);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }

  // Sync delete to Traveller API if applicable
  const authTokenForDelete = getTravellerAuthToken(
    (name) => request.cookies.get(name)?.value
  );
  if (authTokenForDelete && trip?.traveller_trip_id) {
    const syncResult = await deleteTripFromTravellerApi(
      trip.traveller_trip_id,
      authTokenForDelete
    );
    if (syncResult.error) {
      console.warn("[Traveller API] Delete sync failed (non-blocking):", syncResult.error);
    }
  }

  return NextResponse.json({ success: true });
}
