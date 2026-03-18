export interface Airport {
  id: string;
  iata_code: string;
  icao_code: string | null;
  name: string;
  city: string;
  country: string;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  elevation_ft: number | null;
  wifi_available: boolean | null;
  wifi_quality: string | null;
  terminal_count: number | null;
  terminal_info: TerminalInfo[];
  tsa_wait_avg_minutes: number | null;
  security_tips: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface TerminalInfo {
  name: string;
  airlines?: string[];
  facilities?: string[];
}

export interface Airline {
  id: string;
  iata_code: string;
  icao_code: string | null;
  name: string;
  logo_url: string | null;
  alliance: string | null;
  hub_airports: string[];
  fleet_size: number | null;
  fleet_info: Record<string, unknown>;
  country: string | null;
  website: string | null;
  active: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  currency_code: string | null;
  currency_name: string | null;
  primary_language: string | null;
  languages: string[];
  weather_averages: unknown[];
  travel_advisories: TravelAdvisory[];
  popular_seasons: string[];
  description: string | null;
  flag_url: string | null;
  timezone: string | null;
  driving_side: string | null;
  calling_code: string | null;
  population: number | null;
  region: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface TravelAdvisory {
  level: string;
  description: string;
  source: string;
  updated_at: string;
}

export type EnrichmentResult = {
  status: "created" | "exists" | "failed";
  entity_type: "airport" | "airline" | "destination";
  identifier: string;
  error?: string;
};
