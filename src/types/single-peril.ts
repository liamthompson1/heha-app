export interface CoverageFeature {
  feature_name: string;
  detail: string;
  limit_amount: number;
  unit: string;
}

export interface PricingPlan {
  plan_name: string;
  price_min: number;
  price_max: number;
  price_period: string;
  currency: string;
  conditions: string;
}

export interface ApplicableTripType {
  trip_type: string;
  description: string;
}

export interface SinglePerilProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  is_active: boolean;
  coverage_features: CoverageFeature[];
  pricing_plans: PricingPlan[];
  applicable_trip_types: ApplicableTripType[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Map product IDs to booking product types that indicate the product is relevant */
export const PRODUCT_BOOKING_MAP: Record<string, string[]> = {
  car_hire_excess: ["car hire"],
  airport_parking_protection: ["airport parking", "parking"],
};

/** Products that are always shown (general protection) */
export const GENERAL_PRODUCTS = new Set([
  "weather_guarantee",
  "ticket_protection",
  "gadget_cover",
]);

/** Products shown only when matching bookings exist */
export const TRIP_SPECIFIC_PRODUCTS = new Set([
  "car_hire_excess",
  "airport_parking_protection",
]);
