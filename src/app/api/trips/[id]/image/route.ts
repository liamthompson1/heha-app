import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  // Fetch trip to check for existing image
  const { data: trip, error } = await supabase
    .from("trips")
    .select("trip, image_url")
    .eq("id", id)
    .single();

  if (error || !trip) {
    return new NextResponse(null, { status: 404 });
  }

  // If image already stored, redirect to it
  if (trip.image_url) {
    return NextResponse.redirect(trip.image_url, 302);
  }

  // Generate image via Gemini
  const destination = trip.trip?.destination;
  if (!destination) {
    return new NextResponse(null, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const tripType = trip.trip?.trip_type;
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
                  text: `Generate a cinematic travel photograph of ${destination}${tripType ? ` for a ${tripType.toLowerCase()} trip` : ""}. Golden hour lighting, wide angle lens, vibrant colors, no text or watermarks.`,
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
      console.error("Gemini API error:", res.status);
      return new NextResponse(null, { status: 404 });
    }

    const data = await res.json();
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
    const ext = mimeType.includes("jpeg") ? "jpg" : "png";
    const filePath = `trips/${id}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("trip-images")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      // Storage might not be set up — fall back to returning the image directly
      // and store as a data URL in the trip row
      const dataUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
      await supabase
        .from("trips")
        .update({ image_url: dataUrl })
        .eq("id", id);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, s-maxage=604800",
        },
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("trip-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Save URL to trip row
    await supabase
      .from("trips")
      .update({ image_url: publicUrl })
      .eq("id", id);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, s-maxage=604800",
      },
    });
  } catch (err) {
    console.error("Trip image generation failed:", err);
    return new NextResponse(null, { status: 404 });
  }
}
