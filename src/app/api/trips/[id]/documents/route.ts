import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";

const BUCKET = "trip-documents";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/** Read documents array from the trip's JSONB `trip` column */
async function getDocuments(supabase: ReturnType<typeof getSupabaseClient>, tripId: string) {
  const { data } = await supabase
    .from("trips")
    .select("trip")
    .eq("id", tripId)
    .single();
  return (data?.trip as Record<string, unknown>)?.documents as Record<string, unknown>[] ?? [];
}

/** Write documents array back into the trip's JSONB `trip` column */
async function setDocuments(
  supabase: ReturnType<typeof getSupabaseClient>,
  tripId: string,
  documents: Record<string, unknown>[]
) {
  const { data } = await supabase
    .from("trips")
    .select("trip")
    .eq("id", tripId)
    .single();

  const tripData = (data?.trip as Record<string, unknown>) ?? {};
  return supabase
    .from("trips")
    .update({ trip: { ...tripData, documents } })
    .eq("id", tripId);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  const documents = await getDocuments(supabase, id);
  return NextResponse.json({ documents });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const timestamp = Date.now();
  const filePath = `trips/${id}/${timestamp}-${file.name}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[Documents] Upload error:", uploadError.message);
    return NextResponse.json(
      { error: "Upload failed", detail: uploadError.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  const doc = {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type: ext === "pdf" ? "pdf" : "image",
    category: "receipt",
    uploaded_at: new Date().toISOString().split("T")[0],
    size_bytes: file.size,
    status: "verified",
    url: urlData.publicUrl,
    storage_path: filePath,
  };

  const existing = await getDocuments(supabase, id);
  const { error: updateError } = await setDocuments(supabase, id, [...existing, doc]);

  if (updateError) {
    console.error("[Documents] DB update error:", updateError.message);
    return NextResponse.json(
      { error: "Failed to save document metadata" },
      { status: 500 }
    );
  }

  return NextResponse.json({ document: doc });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  const { docId } = await request.json();

  const docs = await getDocuments(supabase, id);
  const doc = docs.find((d) => d.id === docId);

  if (doc?.storage_path) {
    await supabase.storage.from(BUCKET).remove([doc.storage_path as string]);
  }

  const updated = docs.filter((d) => d.id !== docId);
  await setDocuments(supabase, id, updated);

  return NextResponse.json({ success: true });
}
