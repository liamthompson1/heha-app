// --- Raw API types ---

export interface InsurancePolicyJson {
  bookingRef: string;
  cancelled: boolean;
  productType: string;
  search: { from: string; to: string; readableDestination: string };
  links: { view: string; cancel: string; amend: string };
}

export interface InsuranceJsonResponse {
  annualPolicies: InsurancePolicyJson[];
  singleTripPolicies: InsurancePolicyJson[];
}

export interface InsuranceProductType {
  productType: string;
  readableProductType: string;
  minPrice: string | null;
  currency: string;
  url: string;
}

// --- Parsed output ---

export interface ParsedPolicy {
  id: string;
  policyType: "annual" | "single";
  bookingRef: string;
  cancelled: boolean;
  destination: string;
  startDate: string;
  endDate: string;
  links: { view: string; cancel: string; amend: string };
  tier?: "gold" | "silver" | "bronze";
  headingName?: string;
}

export interface ParsedInsuranceData {
  policies: ParsedPolicy[];
  purchaseOption: { price: string; currency: string; url: string } | null;
}

/** Normalize ISO datetime to date-only YYYY-MM-DD */
function toDateOnly(iso: string): string {
  return iso.includes("T") ? iso.split("T")[0] : iso;
}

function mapPolicy(
  p: InsurancePolicyJson,
  policyType: "annual" | "single"
): ParsedPolicy {
  return {
    id: p.bookingRef,
    policyType,
    bookingRef: p.bookingRef,
    cancelled: p.cancelled,
    destination: p.search?.readableDestination ?? "",
    startDate: toDateOnly(p.search?.from ?? ""),
    endDate: toDateOnly(p.search?.to ?? ""),
    links: p.links,
  };
}

export function parseInsuranceJson(
  insuranceJson: InsuranceJsonResponse,
  tripProductTypes?: InsuranceProductType[]
): ParsedInsuranceData {
  const annual = (insuranceJson.annualPolicies ?? [])
    .map((p) => mapPolicy(p, "annual"));
  const single = (insuranceJson.singleTripPolicies ?? [])
    .map((p) => mapPolicy(p, "single"));

  const policies = [...annual, ...single].filter((p) => !p.cancelled);

  let purchaseOption: ParsedInsuranceData["purchaseOption"] = null;
  if (tripProductTypes) {
    const ins = tripProductTypes.find(
      (pt) => pt.productType.toLowerCase() === "insurance"
    );
    if (ins && ins.minPrice != null) {
      purchaseOption = {
        price: ins.minPrice,
        currency: ins.currency,
        url: ins.url,
      };
    }
  }

  return { policies, purchaseOption };
}

/** Parse the insurancejson markdown template output into structured data */
export function parseInsuranceMarkdown(md: string): ParsedInsuranceData {
  const policies: ParsedPolicy[] = [];

  // Split into sections by ## headings
  const sections = md.split(/^## /m).slice(1);

  for (const section of sections) {
    const headingEnd = section.indexOf("\n");
    const heading = section.slice(0, headingEnd).trim();
    const isAnnual = /annual/i.test(heading);
    const isSingle = /single trip/i.test(heading);
    if (!isAnnual && !isSingle) continue;

    const policyType: "annual" | "single" = isAnnual ? "annual" : "single";

    // Detect tier from heading or section body
    function detectTier(text: string): "gold" | "silver" | "bronze" | undefined {
      if (/gold/i.test(text)) return "gold";
      if (/silver/i.test(text)) return "silver";
      if (/bronze/i.test(text)) return "bronze";
      return undefined;
    }
    const sectionTier = detectTier(heading);

    // Split into individual policies by ### Policy headings
    const policyBlocks = section.split(/^### Policy /m).slice(1);

    for (const block of policyBlocks) {
      const refEnd = block.indexOf("\n");
      const bookingRef = block.slice(0, refEnd).trim();

      const status = block.match(/\*\*Status:\*\*\s*(.+)/i)?.[1]?.trim() ?? "";
      if (/cancelled/i.test(status)) continue;

      const destination =
        block.match(/\*\*(?:Cover|Destination):\*\*\s*(.+)/i)?.[1]?.trim() ?? "";

      // Extract dates — formatted like "1st Jan 2026" from the markdown
      const startDateStr =
        block.match(/\*\*(?:Start date|Cover from):\*\*\s*(.+)/i)?.[1]?.trim() ?? "";
      const endDateStr =
        block.match(/\*\*(?:End date|Cover to):\*\*\s*(.+)/i)?.[1]?.trim() ?? "";

      // Extract links
      const viewLink = block.match(/\[View policy\]\(([^)]+)\)/i)?.[1] ?? "";
      const amendLink = block.match(/\[Amend policy\]\(([^)]+)\)/i)?.[1] ?? "";
      const cancelLink = block.match(/\[Cancel policy\]\(([^)]+)\)/i)?.[1] ?? "";

      policies.push({
        id: bookingRef,
        policyType,
        bookingRef,
        cancelled: false,
        destination,
        startDate: startDateStr,
        endDate: endDateStr,
        links: { view: viewLink, cancel: cancelLink, amend: amendLink },
        tier: sectionTier ?? detectTier(block) ?? (isAnnual ? "gold" : undefined),
        headingName: heading,
      });
    }
  }

  return { policies, purchaseOption: null };
}
