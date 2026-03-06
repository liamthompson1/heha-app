import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { generateTripImage } from "@/lib/generate-trip-image";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  const { data: trip, error } = await supabase
    .from("trips")
    .select("trip, image_url")
    .eq("id", id)
    .single();

  if (error || !trip) {
    return new NextResponse(null, { status: 404 });
  }

  // If image already stored, redirect to it with long cache
  if (trip.image_url) {
    return NextResponse.redirect(trip.image_url, {
      status: 302,
      headers: { "Cache-Control": "public, max-age=86400, immutable" },
    });
  }

  const destination = trip.trip?.destination;
  if (!destination) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const { buffer, mimeType } = await generateTripImage({
      tripId: id,
      destination,
      tripType: trip.trip?.trip_type,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, s-maxage=604800",
      },
    });
  } catch (err) {
    console.error("Trip image generation failed:", err);
    return new NextResponse(null, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  const { data: trip, error } = await supabase
    .from("trips")
    .select("trip")
    .eq("id", id)
    .single();

  if (error || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const destination = trip.trip?.destination;
  if (!destination) {
    return NextResponse.json({ error: "No destination" }, { status: 400 });
  }

  let instructions: string | undefined;
  try {
    const body = await request.json();
    instructions = body.instructions;
  } catch {
    // No body is fine — regenerate with default prompt
  }

  try {
    const { publicUrl } = await generateTripImage({
      tripId: id,
      destination,
      tripType: trip.trip?.trip_type,
      customInstructions: instructions,
    });

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (err) {
    console.error("Trip image regeneration failed:", err);
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
