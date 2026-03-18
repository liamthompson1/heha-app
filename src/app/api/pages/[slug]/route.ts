import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPage, upsertPage, deletePage } from "@/lib/supabase/pages";
import { slugSchema } from "@/lib/content";

const updateSchema = z.object({
  content: z.string().min(1, "Content is required"),
  categories: z.array(z.string()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slugSchema.safeParse(slug).success) {
    return NextResponse.json(
      { error: { code: "invalid_slug", message: "Slug must match [a-z0-9-]" } },
      { status: 400 }
    );
  }

  const page = await getPage(slug);
  if (!page) {
    return NextResponse.json(
      { error: { code: "not_found" } },
      { status: 404 }
    );
  }

  return NextResponse.json(page);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slugSchema.safeParse(slug).success) {
    return NextResponse.json(
      { error: { code: "invalid_slug", message: "Slug must match [a-z0-9-]" } },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: result.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { content, categories } = result.data;
  const page = await upsertPage(slug, content, categories);
  if (!page) {
    return NextResponse.json(
      { error: { code: "update_failed", message: "Failed to update page" } },
      { status: 500 }
    );
  }

  return NextResponse.json(page);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slugSchema.safeParse(slug).success) {
    return NextResponse.json(
      { error: { code: "invalid_slug", message: "Slug must match [a-z0-9-]" } },
      { status: 400 }
    );
  }

  const existing = await getPage(slug);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "not_found" } },
      { status: 404 }
    );
  }

  const ok = await deletePage(slug);
  if (!ok) {
    return NextResponse.json(
      { error: { code: "delete_failed", message: "Failed to delete page" } },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
