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
