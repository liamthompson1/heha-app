import { getSupabaseClient } from "@/lib/supabase/client";
import { getBirdImageParts, getExampleImageParts } from "@/lib/bird-images";

interface GenerateImageOptions {
  tripId: string;
  destination: string;
  tripType?: string;
  customInstructions?: string;
}

interface GenerateImageResult {
  buffer: Buffer;
  mimeType: string;
  publicUrl: string;
}

export async function generateTripImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const { tripId, destination, tripType, customInstructions } = options;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const birdParts = getBirdImageParts();
  const exampleParts = getExampleImageParts();

  const tripContext = tripType
    ? ` for a ${tripType.toLowerCase()} trip`
    : "";

  const customSuffix = customInstructions
    ? ` Additional instructions: ${customInstructions}`
    : "";

  const prompt = `Generate a cinematic travel photograph of ${destination}${tripContext}. Include this exact colorful rainbow parrot character naturally in the scene — perched on a railing, sitting on luggage, on a rooftop, etc. The parrot should be realistically sized (small, like an actual parrot) and wearing sunglasses matching the reference images. Golden hour lighting, wide angle lens, vibrant colors, no text or watermarks.${customSuffix}`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
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
              { text: "Reference images of the HEHA! parrot mascot character:" },
              ...birdParts,
              { text: "Examples of the style, quality, and composition we want — the parrot in real travel scenes:" },
              ...exampleParts,
              { text: prompt },
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
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No parts in Gemini response");

  const imagePart = parts.find(
    (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
  );
  if (!imagePart?.inlineData?.data) throw new Error("No image in Gemini response");

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  const mimeType = imagePart.inlineData.mimeType || "image/png";
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";
  const filePath = `trips/${tripId}.${ext}`;

  const supabase = getSupabaseClient();

  // Delete old image (both extensions) before uploading new
  await supabase.storage
    .from("trip-images")
    .remove([`trips/${tripId}.png`, `trips/${tripId}.jpg`]);

  const { error: uploadError } = await supabase.storage
    .from("trip-images")
    .upload(filePath, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) {
    // Fallback: store as data URL
    const dataUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
    await supabase.from("trips").update({ image_url: dataUrl }).eq("id", tripId);
    return { buffer, mimeType, publicUrl: dataUrl };
  }

  const { data: urlData } = supabase.storage
    .from("trip-images")
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  await supabase
    .from("trips")
    .update({ image_url: publicUrl })
    .eq("id", tripId);

  return { buffer, mimeType, publicUrl };
}
