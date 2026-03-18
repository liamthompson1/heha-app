import { NextRequest, NextResponse } from "next/server";
import { getOrGeneratePage } from "@/lib/content/page-generator";
import { slugSchema } from "@/lib/content";

export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const result = slugSchema.safeParse(slug);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "invalid_slug", message: "Slug must match [a-z0-9-]" } },
      { status: 400 }
    );
  }

  try {
    const { content, generated } = await getOrGeneratePage(slug);
    return NextResponse.json({ slug, content, generated });
  } catch (err) {
    console.error("[pages/generate]", err);
    return NextResponse.json(
      { error: { code: "generation_failed", message: "Failed to generate page" } },
      { status: 500 }
    );
  }
}
