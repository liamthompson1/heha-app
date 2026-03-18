import { NextResponse } from "next/server";
import { listPages } from "@/lib/supabase/pages";
import { getPage, upsertPage } from "@/lib/supabase/pages";
import { generateDestinationImage } from "@/lib/generate-destination-image";

export const maxDuration = 300;

/**
 * POST /api/images/destination/batch
 * Generate hero images for all destination pages that don't have one yet.
 * Processes sequentially to avoid rate limits.
 */
export async function POST() {
  const pages = await listPages();

  const results: Array<{ slug: string; status: string; hero_image_url?: string }> = [];

  for (const page of pages) {
    const meta = (page.meta ?? {}) as Record<string, string>;

    // Skip pages that already have a hero image
    if (meta.hero_image_url) {
      results.push({ slug: page.key, status: "skipped" });
      continue;
    }

    const full = await getPage(page.key);
    if (!full) {
      results.push({ slug: page.key, status: "not_found" });
      continue;
    }

    const name = meta.name ?? page.key.replace(/-/g, " ");
    const country = meta.country;

    try {
      const heroUrl = await generateDestinationImage({ slug: page.key, name, country });
      const updatedMeta = { ...full.meta, hero_image_url: heroUrl };
      await upsertPage(page.key, full.content, full.categories, updatedMeta);
      results.push({ slug: page.key, status: "generated", hero_image_url: heroUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Image generation failed for ${page.key}:`, message);
      results.push({ slug: page.key, status: `error: ${message}` });
    }
  }

  const generated = results.filter((r) => r.status === "generated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  return NextResponse.json({
    total: pages.length,
    generated,
    skipped,
    results,
  });
}
