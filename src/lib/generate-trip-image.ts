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
    ? `\nAdditional instructions: ${customInstructions}`
    : "";

  const prompt = `Generate a cinematic, ultra-detailed travel photograph of ${destination}${tripContext}.

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

Motion realism:
Subtle environmental movement (walking pedestrians, rippling water, drifting snow, moving train, swaying palm leaves) while keeping the parrot tack sharp.

Color grading:
High dynamic range, vibrant but natural tones, cinematic contrast, realistic light falloff, no oversaturation.

Lighting (choose one depending on mood):

• Warm golden hour sunlight with strong rim light and soft atmospheric haze
• Cool blue hour twilight with ambient city glow and subtle reflections
• Bright Mediterranean midday sun with crisp shadows and sparkling highlights
• Soft alpine overcast with snow bounce light and cool cinematic tones
• Filtered jungle sunlight with volumetric light rays through foliage
• Dramatic sunset backlight with glowing feather edges and subtle lens flare
• Soft editorial overcast with even natural light and texture focus
• Grand indoor architectural light with diffused skylight and warm highlights
• Tropical poolside reflected light with shimmering water highlights
• Storm-break lighting with directional sun beam and high-contrast atmosphere

CRITICAL:
The pose must be unique and different from the reference images.
Integrate the parrot naturally into the scene as if it truly belongs there.

No text, no logos, no watermarks.${customSuffix}`;

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
