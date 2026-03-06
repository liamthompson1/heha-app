import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSession, getSessionCookieName } from "@/lib/auth/session";

const CONVERSATIONS_BASE =
  "https://apigw.holidayextras.com/chat-assistant-gateway/llm-platform/v0beta2/conversations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = getSupabaseClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("traveller_trip_id")
    .eq("id", id)
    .single();

  if (error || !trip?.traveller_trip_id) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const authSession = request.cookies.get("auth_session")?.value;
  if (!authSession) {
    return NextResponse.json(
      { error: "Not authenticated with HX" },
      { status: 401 }
    );
  }

  const sessionData = await getSession(
    request.cookies.get(getSessionCookieName())?.value
  );
  const userHash = sessionData?.userHash ?? null;

  const apiKey = process.env.HX_STORIES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Stories API key not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { modelId, variables } = body;

  try {
    const res = await fetch(CONVERSATIONS_BASE, {
      method: "POST",
      headers: {
        Cookie: `auth_token=${authSession}`,
        "x-apikey": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        modelId,
        userHash,
        variables: variables ?? {},
      }),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error(
        "[Conversations API] Create failed:",
        res.status,
        responseText.substring(0, 500)
      );
      return NextResponse.json(
        { error: "Failed to create conversation", detail: responseText.substring(0, 500), upstream: res.status },
        { status: res.status }
      );
    }

    const data = JSON.parse(responseText);
    return NextResponse.json({ conversationId: data.conversationId ?? data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Conversations API] Error:", message);
    return NextResponse.json(
      { error: "Failed to create conversation", detail: message },
      { status: 502 }
    );
  }
}
