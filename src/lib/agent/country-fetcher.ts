// REST Countries API fetcher — free, no auth required
// https://restcountries.com/v3.1

export interface CountryData {
  countryName: string;
  capital: string | null;
  currency: string | null; // e.g. "€ EUR (Euro)"
  languages: string[]; // e.g. ["Spanish", "Catalan"]
  timezone: string | null; // e.g. "UTC+01:00"
  flagUrl: string | null; // SVG flag URL
  drivingSide: string | null; // "right" or "left"
  callingCode: string | null; // e.g. "+34"
  population: number | null;
  region: string | null; // e.g. "Europe"
  subregion: string | null; // e.g. "Southern Europe"
}

/**
 * Resolve a city name to a country using OpenStreetMap Nominatim.
 * Free, no auth. Returns country name or null.
 */
export async function resolveCountryFromCity(
  city: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&accept-language=en`,
      {
        headers: { "User-Agent": "heha-app/1.0" }, // Nominatim requires a User-Agent
        next: { revalidate: 86400 }, // 24h cache — city→country doesn't change
      }
    );

    if (!res.ok) return null;

    const results: Array<{ display_name?: string }> = await res.json();
    if (!results?.length) return null;

    // display_name is like "Turin, Piedmont, Italy" — last part is the country
    const parts = results[0].display_name?.split(",").map((s) => s.trim());
    return parts?.[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Full pipeline: try REST Countries directly, if that fails try resolving
 * the input as a city name first via Nominatim.
 */
export async function fetchCountryData(
  nameOrCity: string
): Promise<CountryData | null> {
  // First try as a country name
  const direct = await fetchCountryByName(nameOrCity);
  if (direct) return direct;

  // Fall back: resolve as a city → country, then look up the country
  const country = await resolveCountryFromCity(nameOrCity);
  if (country) return fetchCountryByName(country);

  return null;
}

export async function fetchCountryByName(
  country: string
): Promise<CountryData | null> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=name,currencies,languages,timezones,flags,capital,car,idd,population,region,subregion`,
      { next: { revalidate: 300 } } // 5-min cache
    );

    if (!res.ok) {
      console.warn(`REST Countries fetch failed for "${country}": ${res.status}`);
      return null;
    }

    const results: RestCountryResult[] = await res.json();
    if (!results?.length) return null;

    // Prefer exact match, fall back to first result
    const match =
      results.find(
        (r) => r.name?.common?.toLowerCase() === country.toLowerCase()
      ) ?? results[0];

    return mapCountryResult(match);
  } catch (err) {
    console.warn("REST Countries fetch error:", err);
    return null;
  }
}

// --- Internal types for the raw API response ---

interface RestCountryResult {
  name?: { common?: string; official?: string };
  currencies?: Record<string, { name?: string; symbol?: string }>;
  languages?: Record<string, string>;
  timezones?: string[];
  flags?: { svg?: string; png?: string };
  capital?: string[];
  car?: { signs?: string[]; side?: string };
  idd?: { root?: string; suffixes?: string[] };
  population?: number;
  region?: string;
  subregion?: string;
}

function mapCountryResult(r: RestCountryResult): CountryData {
  // Currency: pick the first one, format as "€ EUR (Euro)"
  let currency: string | null = null;
  if (r.currencies) {
    const [code, info] = Object.entries(r.currencies)[0] ?? [];
    if (code) {
      const parts = [info?.symbol, code, info?.name ? `(${info.name})` : null]
        .filter(Boolean)
        .join(" ");
      currency = parts || null;
    }
  }

  // Languages: values of the languages object
  const languages = r.languages ? Object.values(r.languages) : [];

  // Timezone: pick the first non-UTC one, or the first
  const timezone =
    r.timezones?.find((tz) => tz !== "UTC") ?? r.timezones?.[0] ?? null;

  // Calling code: combine root + first suffix → "+34"
  let callingCode: string | null = null;
  if (r.idd?.root) {
    callingCode = r.idd.root + (r.idd.suffixes?.[0] ?? "");
  }

  return {
    countryName: r.name?.common ?? "Unknown",
    capital: r.capital?.[0] ?? null,
    currency,
    languages,
    timezone,
    flagUrl: r.flags?.svg ?? r.flags?.png ?? null,
    drivingSide: r.car?.side ?? null,
    callingCode,
    population: r.population ?? null,
    region: r.region ?? null,
    subregion: r.subregion ?? null,
  };
}
