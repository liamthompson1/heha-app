import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Look up the trip to get traveller_trip_id
  const supabase = getSupabaseClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("traveller_trip_id")
    .eq("id", id)
    .single();

  if (error || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  if (!trip.traveller_trip_id) {
    return NextResponse.json(
      { error: "Trip has no traveller_trip_id" },
      { status: 404 }
    );
  }

  // Get auth_token cookie for HX Stories API
  const authToken = request.cookies.get("hx_auth_token")?.value;
  if (!authToken) {
    return NextResponse.json(
      { error: "Not authenticated with HX" },
      { status: 401 }
    );
  }

  const apiKey = process.env.HX_STORIES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Stories API key not configured" },
      { status: 500 }
    );
  }

  // Support optional sub-path for nav link navigation
  const subPath = request.nextUrl.searchParams.get("path") || "";
  const resourcePath = subPath
    ? `trips/${trip.traveller_trip_id}/${subPath}`
    : `trips/${trip.traveller_trip_id}`;

  try {
    const storiesUrl = `https://stories.holidayextras.com/${resourcePath}`;
    const res = await fetch(storiesUrl, {
      headers: {
        Cookie: `auth_token=${authToken}`,
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(
        "[Stories API] Failed:",
        res.status,
        await res.text().catch(() => "")
      );
      return NextResponse.json(
        { error: "Failed to fetch stories" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Stories API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 502 }
    );
  }
}
