import fs from "fs";
import path from "path";

interface GeminiInlineData {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

let cached: GeminiInlineData[] | null = null;

export function getBirdImageParts(): GeminiInlineData[] {
  if (cached) return cached;

  const dir = path.join(process.cwd(), "public", "bird");
  cached = [1, 2, 3, 4].map((i) => {
    const buf = fs.readFileSync(path.join(dir, `bird-${i}.png`));
    return {
      inlineData: {
        mimeType: "image/png",
        data: buf.toString("base64"),
      },
    };
  });

  return cached;
}
