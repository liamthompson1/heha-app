export interface ParsedInsuranceData {
  provider: string;
  policyName: string;
  policyNumber: string | null;
  benefits: { icon: string; text: string }[];
  coverageDetails: string[];
  rawHtml: string;
}

const ICON_MAP: [RegExp, string][] = [
  [/medical|hospital|health/i, "\u{1F3E5}"],   // 🏥
  [/cancel|trip\s*cancel/i, "\u2708\uFE0F"],    // ✈️
  [/baggage|luggage|personal\s*effect/i, "\u{1F9F3}"], // 🧳
  [/delay|late/i, "\u23F1\uFE0F"],              // ⏱️
  [/dental/i, "\u{1F9B7}"],                      // 🦷
  [/legal|liability/i, "\u2696\uFE0F"],          // ⚖️
];

function iconForBenefit(text: string): string {
  for (const [re, icon] of ICON_MAP) {
    if (re.test(text)) return icon;
  }
  return "\u2713"; // ✓
}

export function parseInsuranceHtml(html: string): ParsedInsuranceData {
  const rawHtml = html;

  // Extract <li> items as benefits
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const benefits: { icon: string; text: string }[] = [];
  let liMatch;
  while ((liMatch = liRe.exec(html)) !== null) {
    const text = liMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text) {
      benefits.push({ icon: iconForBenefit(text), text });
    }
  }

  // Extract provider from <strong> or <b> text
  const strongRe = /<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi;
  let provider = "Holiday Extras Insurance";
  let policyName = "Travel Insurance";
  let strongMatch;
  while ((strongMatch = strongRe.exec(html)) !== null) {
    const text = strongMatch[1].replace(/<[^>]+>/g, "").trim();
    if (!text) continue;
    // Use first meaningful strong text as policy name, second as provider
    if (policyName === "Travel Insurance") {
      policyName = text;
    } else if (provider === "Holiday Extras Insurance") {
      provider = text;
    }
  }

  // Extract <p> content as coverage details
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const coverageDetails: string[] = [];
  let pMatch;
  while ((pMatch = pRe.exec(html)) !== null) {
    const text = pMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text) coverageDetails.push(text);
  }

  // Try to match policy number pattern
  const policyNumberRe = /\b(HX-\d{4}-\d+)\b/i;
  const pnMatch = html.match(policyNumberRe);
  const policyNumber = pnMatch ? pnMatch[1] : null;

  return {
    provider,
    policyName,
    policyNumber,
    benefits,
    coverageDetails,
    rawHtml,
  };
}
