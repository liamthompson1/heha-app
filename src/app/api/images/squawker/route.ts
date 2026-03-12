import { NextRequest, NextResponse } from "next/server";
import { getBirdImageParts, getExampleImageParts } from "@/lib/bird-images";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const { prompt } = await request.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const birdParts = getBirdImageParts();
  const exampleParts = getExampleImageParts();

  const fullPrompt = `Generate a cinematic, ultra-detailed image of the HEHA! parrot mascot character based on the following description:

${prompt}

Use the attached rainbow parrot images ONLY as character design reference (color gradient, feather texture, crest shape, sunglasses style).
Do NOT replicate the reference pose, framing, or composition.

Character details:
Vibrant rainbow feather gradient (red → orange → yellow → green → blue → purple), dimensional layered feathers with realistic micro-texture and subtle natural sheen.
Rainbow crest.
Glossy yellow sunglasses with accurate reflections from the surrounding environment.
Confident, joyful, adventurous expression.

Style:
High-end animated realism (Pixar / DreamWorks-level quality), physically based rendering, ultra-clean global illumination, natural shadow physics, premium aesthetic.

Camera:
Wide-angle lens (24–35mm), shallow depth of field, creamy cinematic bokeh, sharp focus on the parrot, dynamic perspective.

Color grading:
High dynamic range, vibrant but natural tones, cinematic contrast, realistic light falloff, no oversaturation.

CRITICAL:
The pose must feel candid, spontaneous, and captured mid-moment.
Integrate the parrot naturally into the scene.
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
              { text: "Examples of the style, quality, and composition we want:" },
              ...exampleParts,
              { text: fullPrompt },
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
    return NextResponse.json(
      { error: `Gemini API error ${res.status}: ${text}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts) {
    return NextResponse.json({ error: "No parts in Gemini response" }, { status: 502 });
  }

  const imagePart = parts.find(
    (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
  );
  if (!imagePart?.inlineData?.data) {
    return NextResponse.json({ error: "No image in Gemini response" }, { status: 502 });
  }

  return NextResponse.json({
    image: `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`,
  });
}
