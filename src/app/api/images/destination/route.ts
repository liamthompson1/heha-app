import { NextRequest, NextResponse } from "next/server";

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
