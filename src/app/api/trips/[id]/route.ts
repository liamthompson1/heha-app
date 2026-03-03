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
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json({ trip: data });
}
