import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listPages } from "@/lib/supabase/pages";
import { generatePageFromPrompt } from "@/lib/content/page-generator";
import { slugSchema } from "@/lib/content";

export const maxDuration = 60;

export async function GET() {
  const pages = await listPages();
  return NextResponse.json({ pages });
}

const generateSchema = z.object({
  slug: slugSchema,
  prompt: z.string().min(1, "Prompt is required"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const result = generateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: result.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { slug, prompt } = result.data;

  try {
    const content = await generatePageFromPrompt(prompt, slug);
    return NextResponse.json({ slug, content, generated: true });
  } catch (err) {
    console.error("[pages/generate]", err);
    return NextResponse.json(
      { error: { code: "generation_failed", message: "Failed to generate page" } },
      { status: 500 }
    );
  }
}
