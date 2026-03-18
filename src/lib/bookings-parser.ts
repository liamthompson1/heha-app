export interface ParsedBooking {
  productType: string;
  bookingRef: string;
  status: "active" | "cancelled" | "unknown";
  fields: Record<string, string>; // e.g. From, To, Check-in, Room Type, Terminal, Cover Region
  links: { label: string; url: string }[];
}

/** Keys that are metadata, not displayable fields (lowercase for case-insensitive match) */
const SKIP_FIELDS = new Set(["booking ref", "status", "manage booking", "manage"]);

/** Extract useful params from a booking URL (e.g. pickup/dropoff dates for car hire) */
function extractParamsAsFields(url: string): Record<string, string> {
  const fields: Record<string, string> = {};
  try {
    const parsed = new URL(url, "https://placeholder.com");
    const sp = parsed.searchParams;

    // Common HX search params
    const pickUp = sp.get("pickUp") || sp.get("pickup") || sp.get("dateFrom") || sp.get("from");
    const dropOff = sp.get("dropOff") || sp.get("dropoff") || sp.get("dateTo") || sp.get("to");

    if (pickUp) fields["Pick-up"] = formatParamDate(pickUp);
    if (dropOff) fields["Drop-off"] = formatParamDate(dropOff);
  } catch {
    // ignore
  }
  return fields;
}

/** Try to make a date param human-readable */
function formatParamDate(val: string): string {
  // If it's ISO-ish, format nicely
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return val;
}

/**
 * Parse the "## 🧾 Your Bookings" section from the Stories `json` markdown.
 * Each booking is a `### {ProductType}` block with bullet fields and links.
 */
export function parseBookingsMarkdown(md: string): ParsedBooking[] {
  // Find the bookings section
  const sectionMatch = md.match(/## 🧾\s*Your Bookings\s*\n([\s\S]*?)(?=\n## |$)/);
  if (!sectionMatch) return [];

  const sectionBody = sectionMatch[1];

  // Split into individual booking blocks by ### heading
  const blocks = sectionBody.split(/(?=^### )/m).filter((b) => b.trim());

  return blocks.map((block) => {
    // Extract product type from ### heading
    const headingMatch = block.match(/^### (.+)/m);
    const productType = headingMatch?.[1]?.trim() ?? "Booking";

    // Extract booking ref
    const refMatch = block.match(/\*\*Booking Ref:\*\*\s*(.+)/);
    const bookingRef = refMatch?.[1]?.trim() ?? "";

    // Extract status
    const statusMatch = block.match(/\*\*Status:\*\*\s*(.+)/);
    const statusRaw = statusMatch?.[1]?.trim() ?? "";
    let status: ParsedBooking["status"] = "unknown";
    if (/active/i.test(statusRaw)) status = "active";
    else if (/cancel/i.test(statusRaw)) status = "cancelled";

    // Extract fields (bold key: value pattern), skipping metadata keys
    const fields: Record<string, string> = {};
    const fieldRe = /\*\*([^*]+):\*\*\s*(.+)/g;
    let m;
    while ((m = fieldRe.exec(block))) {
      const key = m[1].trim();
      const value = m[2].trim();
      // Skip metadata keys (case-insensitive)
      if (SKIP_FIELDS.has(key.toLowerCase())) continue;
      // Skip values that contain markdown links or raw URLs
      if (/\[.*\]\(.*\)/.test(value)) continue;
      if (/https?:\/\//.test(value)) continue;
      // Skip empty values
      if (!value) continue;
      fields[key] = value;
    }

    // Also handle #### sub-headings followed by bullet links (e.g. "#### Manage Booking")
    // These are already captured by the link regex below, so we just skip them

    // Extract links: [Label](url) patterns — deduplicate by label
    const links: { label: string; url: string }[] = [];
    const seenLabels = new Set<string>();
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
    while ((m = linkRe.exec(block))) {
      const label = m[1].trim();
      const lowerLabel = label.toLowerCase();
      if (!seenLabels.has(lowerLabel)) {
        seenLabels.add(lowerLabel);
        links.push({ label, url: m[2].trim() });
      }
    }

    // Extract useful search params from the first link as extra fields
    if (links.length > 0) {
      const paramFields = extractParamsAsFields(links[0].url);
      for (const [k, v] of Object.entries(paramFields)) {
        if (!fields[k]) fields[k] = v;
      }
    }

    return { productType, bookingRef, status, fields, links };
  }).filter((b) => b.bookingRef !== "");
}
