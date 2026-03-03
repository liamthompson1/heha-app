import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { TripContent } from "@/types/trip-content";

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  // Fetch the trip
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const destination = trip.trip?.destination;
  if (!destination) {
    return NextResponse.json(
      { error: "Trip has no destination" },
      { status: 400 }
    );
  }

  // Check for fresh cached content
  const existing = trip.trip_content as TripContent | null;
  if (existing?.generated_at && existing?.destination === destination) {
    const age = Date.now() - new Date(existing.generated_at).getTime();
    if (age < CACHE_MAX_AGE_MS) {
      return NextResponse.json({ content: existing, cached: true });
    }
  }

  // Generate content with Claude
  try {
    const anthropic = new Anthropic();

    const tripType = trip.trip?.trip_type || "leisure";
    const startDate = trip.trip?.start_date || "";
    const endDate = trip.trip?.end_date || "";
    const travelers = trip.people_travelling?.length || 1;

    const userPrompt = `Destination: ${destination}
Trip type: ${tripType}
Dates: ${startDate} to ${endDate}
Number of travelers: ${travelers}
${trip.anything_else_we_should_know ? `Notes: ${trip.anything_else_we_should_know}` : ""}`;

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: `You are a travel content generator for the HEHA travel platform. Given a trip destination, dates, and preferences, generate rich, helpful content.

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "things_to_do": [{"name":"...","description":"...","category":"culture|nature|food|nightlife|adventure|shopping","estimated_cost":"...","duration":"...","insider_tip":"..."}],
  "local_knowledge": [{"title":"...","content":"...","category":"transport|etiquette|safety|money|language|general"}],
  "food_and_drink": [{"name":"...","type":"...","description":"...","price_range":"$|$$|$$$|$$$$"}],
  "packing_tips": ["..."],
  "best_areas": [{"name":"...","vibe":"...","good_for":"..."}]
}

Generate 6-8 things to do, 5-6 local tips, 4-5 food spots, 5-6 packing tips, and 3-4 best areas.
Make content specific to the destination and trip dates/type. Be practical and opinionated.`,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      msg.content[0].type === "text" ? msg.content[0].text : "";
    const parsed = JSON.parse(text);

    const content: TripContent = {
      generated_at: new Date().toISOString(),
      destination,
      ...parsed,
    };

    // Cache in Supabase
    await supabase
      .from("trips")
      .update({ trip_content: content })
      .eq("id", id);

    return NextResponse.json({ content, cached: false });
  } catch (err) {
    console.error("Content generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate trip content" },
      { status: 500 }
    );
  }
}
