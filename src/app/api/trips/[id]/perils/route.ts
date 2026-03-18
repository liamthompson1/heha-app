import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("trips")
    .select("trip")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const selectedPerils: string[] = (data.trip as Record<string, unknown>)?.selected_perils as string[] ?? [];
  return NextResponse.json({ selected_perils: selectedPerils });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { product_id, action } = await request.json();

  if (!product_id || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  // Get current trip data
  const { data: tripRow, error: fetchError } = await supabase
    .from("trips")
    .select("trip")
    .eq("id", id)
    .single();

  if (fetchError || !tripRow) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const tripData = tripRow.trip as Record<string, unknown>;
  let perils: string[] = (tripData?.selected_perils as string[]) ?? [];

  if (action === "add" && !perils.includes(product_id)) {
    perils = [...perils, product_id];
  } else if (action === "remove") {
    perils = perils.filter((p) => p !== product_id);
  }

  // Update the trip JSONB
  const updatedTrip = { ...tripData, selected_perils: perils };
  const { error: updateError } = await supabase
    .from("trips")
    .update({ trip: updatedTrip })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ selected_perils: perils });
}
