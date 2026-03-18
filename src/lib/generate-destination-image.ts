import { getSupabaseClient } from "@/lib/supabase/client";
import { getBirdImageParts, getExampleImageParts } from "@/lib/bird-images";

interface GenerateDestinationImageOptions {
  slug: string;
  name: string;
  country?: string;
}

/**
 * Generate a hero image for a destination page using Gemini,
 * upload to Supabase storage, and return the public URL.
 */
export async function generateDestinationImage(
  options: GenerateDestinationImageOptions
): Promise<string> {
  const { slug, name, country } = options;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const birdParts = getBirdImageParts();
  const exampleParts = getExampleImageParts();

  const location = country ? `${name}, ${country}` : name;

  const prompt = `Generate a cinematic, ultra-detailed travel photograph of ${location}.

Use the attached rainbow parrot images ONLY as character design reference (color gradient, feather texture, crest shape, sunglasses style).
Do NOT replicate the reference pose, framing, or composition.

The parrot must appear in a completely new, natural, context-aware pose that fits the environment (for example: casually perched on a railing, gripping a suitcase handle, adjusting sunglasses, leaning slightly forward, mid-step on cobblestones, balancing on a ski lift bar, interacting subtly with surroundings).

Avoid symmetrical wings-spread studio poses unless the scene naturally requires flight.
Avoid centered character-sheet composition.
Avoid black or empty backgrounds.
The pose should feel candid, spontaneous, and captured mid-moment like a real travel photograph.

Scale:
The parrot must be realistically small (true-to-life parrot size), physically believable within the environment — not oversized, not mascot scale.

Character details:
Vibrant rainbow feather gradient (red → orange → yellow → green → blue → purple), dimensional layered feathers with realistic micro-texture and subtle natural sheen.
Rainbow crest.
Glossy yellow sunglasses with accurate reflections from the surrounding environment.
Confident, joyful, adventurous expression.

Style:
High-end animated realism (Pixar / DreamWorks-level quality), physically based rendering, ultra-clean global illumination, natural shadow physics, premium travel campaign aesthetic.

Camera:
Wide-angle lens (24–35mm), shallow depth of field, creamy cinematic bokeh, sharp focus on the parrot, dynamic perspective, travel editorial composition.

Color grading:
High dynamic range, vibrant but natural tones, cinematic contrast, realistic light falloff, no oversaturation.

The scene must prominently feature a famous or iconic landmark, street, or landscape of ${location}.

No text, no logos, no watermarks.`;

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
  const filePath = `destinations/${slug}.${ext}`;

  const supabase = getSupabaseClient();

  // Remove old image (both extensions) before uploading
  await supabase.storage
    .from("trip-images")
    .remove([`destinations/${slug}.png`, `destinations/${slug}.jpg`]);

  const { error: uploadError } = await supabase.storage
    .from("trip-images")
    .upload(filePath, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) {
    console.error("Destination image upload failed:", uploadError.message);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("trip-images")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
