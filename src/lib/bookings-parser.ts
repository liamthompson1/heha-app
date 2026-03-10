export interface ParsedBooking {
  productType: string;
  bookingRef: string;
  status: "active" | "cancelled" | "unknown";
  fields: Record<string, string>; // e.g. From, To, Check-in, Room Type, Terminal, Cover Region
  links: { label: string; url: string }[];
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

    // Extract other fields (bold key: value pattern)
    const fields: Record<string, string> = {};
    const fieldRe = /\*\*([^*]+):\*\*\s*(.+)/g;
    let m;
    while ((m = fieldRe.exec(block))) {
      const key = m[1].trim();
      const value = m[2].trim();
      if (key !== "Booking Ref" && key !== "Status") {
        fields[key] = value;
      }
    }

    // Extract links: [Label](url) patterns
    const links: { label: string; url: string }[] = [];
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
    while ((m = linkRe.exec(block))) {
      links.push({ label: m[1].trim(), url: m[2].trim() });
    }

    return { productType, bookingRef, status, fields, links };
  });
}
