import { NextRequest, NextResponse } from "next/server";
import { generateDestinationImage } from "@/lib/generate-destination-image";
import { getPage, upsertPage } from "@/lib/supabase/pages";

export async function GET(request: NextRequest) {
  const place = request.nextUrl.searchParams.get("place");
  const tripType = request.nextUrl.searchParams.get("type");

  if (!place) {
    return new NextResponse(null, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a cinematic travel photograph of ${place}${tripType ? ` for a ${tripType.toLowerCase()} trip` : ""}. Golden hour lighting, wide angle lens, vibrant colors, no text or watermarks.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return new NextResponse(null, { status: 404 });
    }

    const data = await res.json();

    // Extract base64 image from response
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts) {
      return new NextResponse(null, { status: 404 });
    }

    const imagePart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    const mimeType = imagePart.inlineData.mimeType || "image/png";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, s-maxage=604800",
      },
    });
  } catch (err) {
    console.error("Gemini image generation failed:", err);
    return new NextResponse(null, { status: 404 });
  }
}

export const maxDuration = 60;

/**
 * POST /api/images/destination?slug=barcelona
 * Generate a hero image for a destination page, store in Supabase,
 * and update the page's meta.hero_image_url.
 */
export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const page = await getPage(slug);
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const meta = (page.meta ?? {}) as Record<string, string>;
  const name = meta.name ?? slug.replace(/-/g, " ");
  const country = meta.country;

  try {
    const heroUrl = await generateDestinationImage({ slug, name, country });

    // Update page meta with new hero_image_url
    const updatedMeta = { ...page.meta, hero_image_url: heroUrl };
    await upsertPage(slug, page.content, page.categories, updatedMeta);

    return NextResponse.json({ hero_image_url: heroUrl });
  } catch (err) {
    console.error("Destination image generation failed:", err);
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
