import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: "audio file is required" },
        { status: 400 }
      );
    }

    // Forward to ElevenLabs Scribe STT
    const elevenForm = new FormData();
    elevenForm.append("file", audioFile, "audio.wav");
    elevenForm.append("model_id", "scribe_v1");
    elevenForm.append("language_code", "eng");

    const response = await fetch(
      "https://api.elevenlabs.io/v1/speech-to-text",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: elevenForm,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs STT error:", response.status, errorText);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text ?? "" });
  } catch (error) {
    console.error("Transcribe route error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
