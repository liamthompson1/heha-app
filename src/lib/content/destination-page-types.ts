// ─── HX Product Types ────────────────────────────────────────

export type HXProductType =
  | "airport_parking"
  | "airport_hotel"
  | "airport_lounge"
  | "car_hire"
  | "travel_insurance"
  | "airport_transfer"
  | "holiday_extras_bundle";

// ─── Destination content shapes ──────────────────────────────
// Internal types describing the structure of a generated destination guide.

export interface QuickFacts {
  currency: string;
  language: string;
  timezone: string;
  drivingSide: string;
  callingCode: string;
  bestSeason: string;
  advisoryLevel: string;
}

export interface MonthlyWeather {
  month: string;
  highC: number;
  lowC: number;
  rainPercent: number;
  conditions: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
