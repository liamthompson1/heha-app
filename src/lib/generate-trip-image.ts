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

  const lightingOptions = [
    "Warm golden hour sunlight, strong rim light, long soft shadows, glowing feather edges, soft atmospheric haze.",
    "Cool blue hour twilight, ambient city glow, practical lights in background, gentle edge light, subtle neon reflections in sunglasses.",
    "Bright Mediterranean midday sun, crisp shadows, ultra-clear sky, sparkling reflections, commercial luxury travel photography look.",
    "Soft alpine overcast, diffused cloud lighting, snow bounce light illuminating underside of wings, cool cinematic tones.",
    "Filtered jungle sunlight, volumetric light rays through foliage, dappled shadows, humid atmosphere haze.",
    "Dramatic sunset backlight, glowing feather rim, subtle lens flare, heroic sky gradient.",
    "Soft editorial overcast, even natural light, low contrast, texture-focused premium lifestyle photography.",
    "Grand indoor architectural light, diffused top light through glass ceiling, warm highlights, cool ambient shadows, subtle dust particles.",
    "Tropical poolside reflected light, bright sun with water bounce reflections dancing on feathers, relaxed luxury mood.",
    "Storm break lighting, dark clouds with a directional beam illuminating the parrot, epic high-contrast atmosphere.",
  ];
  const lighting = lightingOptions[Math.floor(Math.random() * lightingOptions.length)];

  const prompt = `Generate a cinematic, ultra-detailed travel photograph of ${destination}${tripContext}.

Naturally integrate the exact colorful rainbow parrot character into the environment (perched on a railing, sitting on luggage, relaxing by a pool, standing on a cliff edge, riding a ski lift, etc.). The parrot must be realistically small (true-to-life parrot scale — not oversized), physically believable within the scene.

Character details:
Vibrant rainbow feathers with a smooth red → orange → yellow → green → blue → purple gradient, dimensional feather layering, detailed micro-texture, subtle natural sheen. Rainbow crest. Wearing glossy yellow sunglasses that accurately reflect the surrounding environment. Confident, joyful, adventurous expression.

Style:
High-end animated realism (Pixar / DreamWorks quality), physically based rendering, ultra-clean global illumination, natural shadow physics, premium travel campaign aesthetic.

Camera:
Wide-angle lens (24–35mm), shallow depth of field, creamy cinematic bokeh, sharp focus on the parrot, dynamic perspective, travel editorial composition.

Motion realism:
Subtle environmental motion (moving train, drifting snow, rippling water, walking pedestrians, palm leaves swaying) while keeping the parrot tack sharp.

Color grading:
High dynamic range, vibrant but natural tones, cinematic contrast, no oversaturation.

Lighting:
${lighting}

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
