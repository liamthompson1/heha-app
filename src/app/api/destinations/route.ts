import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createDestinationSchema } from "@/lib/validation/destination-schema";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");

  const supabase = getSupabaseClient();
  let query = supabase
    .from("destinations")
    .select("*")
    .order("city", { ascending: true });

  if (search) {
    query = query.or(
      `city.ilike.%${search}%,country.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = createDestinationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.format() },
      { status: 422 }
    );
  }

  const cleaned = Object.fromEntries(
    Object.entries(result.data).filter(([, v]) => v !== "")
  );

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("destinations")
    .insert(cleaned)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
