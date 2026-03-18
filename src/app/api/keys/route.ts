import { NextRequest, NextResponse } from "next/server";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/supabase/api-keys";

export async function GET() {
  const keys = await listApiKeys();
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, auto_publish = true } = body as {
    name: string;
    auto_publish?: boolean;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { row, rawKey } = await createApiKey(name.trim(), auto_publish);
  return NextResponse.json({ key: rawKey, meta: row }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = (await req.json()) as { id: string };
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const ok = await revokeApiKey(id);
  if (!ok) {
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
