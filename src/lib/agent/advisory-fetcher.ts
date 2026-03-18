// US State Department Travel Advisory API — free, no auth
// https://cadataapi.state.gov/api/TravelAdvisories

export interface TravelAdvisoryData {
  level: number; // 1-4
  levelLabel: string; // e.g. "Exercise Increased Caution"
  description: string; // summary text
  updatedAt: string; // ISO date
  link: string; // URL to full advisory
}

export async function fetchTravelAdvisory(
  countryName: string
): Promise<TravelAdvisoryData | null> {
  try {
    const res = await fetch(
      "https://cadataapi.state.gov/api/TravelAdvisories",
      { next: { revalidate: 3600 } } // 1-hour cache — advisories change rarely
    );

    if (!res.ok) {
      console.warn(`Travel Advisory fetch failed: ${res.status}`);
      return null;
    }

    const entries: AdvisoryEntry[] = await res.json();
    if (!entries?.length) return null;

    // Match by country name in the title (e.g. "Spain - Level 1: Exercise Normal Precautions")
    const needle = countryName.toLowerCase();
    const match = entries.find((e) =>
      e.title?.toLowerCase().startsWith(needle)
    );

    if (!match) return null;

    return mapAdvisoryEntry(match);
  } catch (err) {
    console.warn("Travel Advisory fetch error:", err);
    return null;
  }
}

// --- Internal types ---

interface AdvisoryEntry {
  title?: string;
  link?: string;
  summary?: string;
  published?: string;
  updated?: string;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "Exercise Normal Precautions",
  2: "Exercise Increased Caution",
  3: "Reconsider Travel",
  4: "Do Not Travel",
};

function mapAdvisoryEntry(e: AdvisoryEntry): TravelAdvisoryData {
  // Parse level from title: "Spain - Level 2: Exercise Increased Caution"
  const levelMatch = e.title?.match(/Level (\d)/i);
  const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;

  // Strip HTML tags from summary
  const description = e.summary
    ? e.summary.replace(/<[^>]*>/g, "").trim()
    : LEVEL_LABELS[level] ?? "";

  return {
    level,
    levelLabel: LEVEL_LABELS[level] ?? `Level ${level}`,
    description,
    updatedAt: e.updated ?? e.published ?? "",
    link: e.link ?? "",
  };
}
