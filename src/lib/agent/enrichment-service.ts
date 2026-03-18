import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchAirportFromAPI } from "./airport-fetcher";
import { fetchAirlineFromAPI } from "./airline-fetcher";
import { fetchCountryData } from "./country-fetcher";
import type { EnrichmentResult } from "@/types/reference-data";

export async function enrichAirport(
  iataCode: string
): Promise<EnrichmentResult> {
  const supabase = getSupabaseClient();
  const code = iataCode.toUpperCase();

  // Check if already exists
  const { data: existing } = await supabase
    .from("airports")
    .select("id")
    .eq("iata_code", code)
    .single();

  if (existing) {
    return { status: "exists", entity_type: "airport", identifier: code };
  }

  // Fetch from API
  const fetched = await fetchAirportFromAPI(code);
  if (!fetched) {
    return {
      status: "failed",
      entity_type: "airport",
      identifier: code,
      error: "Could not fetch airport data from API",
    };
  }

  // Store
  const { error } = await supabase.from("airports").insert(fetched);
  if (error) {
    return {
      status: "failed",
      entity_type: "airport",
      identifier: code,
      error: error.message,
    };
  }

  return { status: "created", entity_type: "airport", identifier: code };
}

export async function enrichAirline(
  iataCode: string
): Promise<EnrichmentResult> {
  const supabase = getSupabaseClient();
  const code = iataCode.toUpperCase();

  const { data: existing } = await supabase
    .from("airlines")
    .select("id")
    .eq("iata_code", code)
    .single();

  if (existing) {
    return { status: "exists", entity_type: "airline", identifier: code };
  }

  const fetched = await fetchAirlineFromAPI(code);
  if (!fetched) {
    return {
      status: "failed",
      entity_type: "airline",
      identifier: code,
      error: "Could not fetch airline data from API",
    };
  }

  const { error } = await supabase.from("airlines").insert(fetched);
  if (error) {
    return {
      status: "failed",
      entity_type: "airline",
      identifier: code,
      error: error.message,
    };
  }

  return { status: "created", entity_type: "airline", identifier: code };
}

export async function enrichDestination(
  city: string,
  country: string
): Promise<EnrichmentResult> {
  const supabase = getSupabaseClient();
  const identifier = `${city}, ${country}`;

  const { data: existing } = await supabase
    .from("destinations")
    .select("id")
    .eq("city", city)
    .eq("country", country)
    .single();

  if (existing) {
    return { status: "exists", entity_type: "destination", identifier };
  }

  // Fetch country data from REST Countries API
  const countryData = await fetchCountryData(country);

  // Extract currency code and name from the formatted string (e.g. "€ EUR (Euro)")
  let currencyCode: string | null = null;
  let currencyName: string | null = null;
  if (countryData?.currency) {
    const match = countryData.currency.match(/([A-Z]{3})\s*\((.+)\)/);
    if (match) {
      currencyCode = match[1];
      currencyName = match[2];
    }
  }

  const row = {
    city,
    country: countryData?.countryName ?? country,
    currency_code: currencyCode,
    currency_name: currencyName,
    primary_language: countryData?.languages?.[0] ?? null,
    languages: countryData?.languages ?? [],
    flag_url: countryData?.flagUrl ?? null,
    timezone: countryData?.timezone ?? null,
    driving_side: countryData?.drivingSide ?? null,
    calling_code: countryData?.callingCode ?? null,
    population: countryData?.population ?? null,
    region: countryData?.subregion ?? countryData?.region ?? null,
    source: "rest-countries",
  };

  const { error } = await supabase.from("destinations").insert(row);
  if (error) {
    return {
      status: "failed",
      entity_type: "destination",
      identifier,
      error: error.message,
    };
  }

  return { status: "created", entity_type: "destination", identifier };
}

/** Called after trip creation to enrich all related entities */
export async function enrichTripEntities(params: {
  flights?: Array<{
    airline?: string;
    departure_airport?: string;
    arrival_airport?: string;
    from_airport?: string;
    to_airport?: string;
  }>;
  destination?: string;
}): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];

  // Enrich airports from flights
  if (params.flights?.length) {
    const airportCodes = new Set<string>();
    const airlineCodes = new Set<string>();

    for (const flight of params.flights) {
      const dep = flight.departure_airport || flight.from_airport;
      const arr = flight.arrival_airport || flight.to_airport;
      if (dep) airportCodes.add(dep);
      if (arr) airportCodes.add(arr);
      if (flight.airline) airlineCodes.add(flight.airline);
    }

    for (const code of airportCodes) {
      try {
        results.push(await enrichAirport(code));
      } catch (err) {
        console.error(`Failed to enrich airport ${code}:`, err);
      }
    }

    for (const code of airlineCodes) {
      try {
        results.push(await enrichAirline(code));
      } catch (err) {
        console.error(`Failed to enrich airline ${code}:`, err);
      }
    }
  }

  // Enrich destination (attempt to split "City, Country" format)
  if (params.destination) {
    const parts = params.destination.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      try {
        results.push(await enrichDestination(parts[0], parts[parts.length - 1]));
      } catch (err) {
        console.error(`Failed to enrich destination ${params.destination}:`, err);
      }
    }
  }

  return results;
}
