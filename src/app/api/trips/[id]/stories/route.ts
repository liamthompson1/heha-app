import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";

const STORIES_BASE = "https://apigw.holidayextras.com/chat-assistant-gateway/llm-platform/v0beta2/stories";

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

  // The Stories API authenticates via the auth_session cookie sent as auth_token.
  // Check all cookie sources: auth_session, hx_auth_session (from OTP flow), hx_bearer_token.
  const authSession =
    request.cookies.get("auth_session")?.value ??
    request.cookies.get("hx_auth_session")?.value ??
    request.cookies.get("hx_bearer_token")?.value;
  if (!authSession) {
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
    // Build upstream URL, forwarding any extra params from the client
    const storiesUrl = new URL(STORIES_BASE);
    storiesUrl.searchParams.set("resourcePath", resourcePath);
    // JSON endpoints (insurancejson, json) need format=json; default stories use HTML
    const isJsonEndpoint = subPath === "insurancejson" || subPath === "json";
    storiesUrl.searchParams.set("format", isJsonEndpoint ? "json" : "html");
    storiesUrl.searchParams.set("disableFallbackOnError", "true");
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      if (key !== "path") {
        storiesUrl.searchParams.set(key, value);
      }
    }
    console.log("[Stories API] Fetching:", storiesUrl.toString());

    const res = await fetch(storiesUrl.toString(), {
      headers: {
        Cookie: `auth_token=${authSession}`,
        "x-apikey": apiKey,
        Accept: "application/json",
      },
    });

    const responseText = await res.text();
    console.log("[Stories API] Status:", res.status, "Response length:", responseText.length);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch stories", status: res.status, detail: responseText.substring(0, 500) },
        { status: res.status }
      );
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stories API] Error:", message);
    return NextResponse.json(
      { error: "Failed to fetch stories", detail: message },
      { status: 502 }
    );
  }
}
