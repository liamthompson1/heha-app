import type {
  Destination,
  ApiKey,
  ContentHistoryEntry,
  AdminStats,
} from "@/types/destination";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ---------------------------------------------------------------------------
// Mock data — used while the backend team builds the real API
// ---------------------------------------------------------------------------

const MOCK_DESTINATIONS: Destination[] = [
  {
    id: "1",
    slug: "barcelona",
    name: "Barcelona",
    country: "Spain",
    continent: "Europe",
    hero_image_url:
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80",
    summary:
      "A vibrant Mediterranean city blending stunning Gaudí architecture, world-class beaches, and an unrivalled food scene.",
    content_markdown: `## Overview

Barcelona is the cosmopolitan capital of Catalonia, Spain's most fiercely independent region. Perched on the northeastern Mediterranean coast, it seamlessly blends 2,000 years of history with cutting-edge modernism. From the unfinished masterpiece of La Sagrada Família to the winding alleys of the Gothic Quarter, every neighbourhood tells a different story.

The city runs on a rhythm of late lunches, paseos along La Rambla, and nights that don't start until midnight. Whether you're here for the architecture, the beaches, or simply the pintxos, Barcelona rewards those who take their time.

## When to Visit

The best months are **May–June** and **September–October** — warm enough for the beach, cool enough to walk the city comfortably.

| Season | Temp (°C) | Crowd Level | Notes |
|--------|-----------|-------------|-------|
| Spring (Mar–May) | 14–22 | Medium | Ideal for sightseeing |
| Summer (Jun–Aug) | 24–30 | Very High | Beach season, peak prices |
| Autumn (Sep–Nov) | 16–25 | Medium | Great weather, fewer tourists |
| Winter (Dec–Feb) | 8–15 | Low | Mild, some rain, cheap flights |

## Neighbourhoods

### Gothic Quarter (Barri Gòtic)
The medieval heart of the city. Narrow streets, hidden squares, and the towering Barcelona Cathedral. Best for wandering aimlessly.

### Eixample
The grand grid of Modernista architecture. Home to La Sagrada Família, Casa Batlló, and Casa Milà. Wide boulevards lined with restaurants and shops.

### El Born
Artsy, bohemian, and packed with independent boutiques, galleries, and cocktail bars. The Picasso Museum is here.

### Barceloneta
The old fishing village turned beach neighbourhood. Seafood restaurants, chiringuitos on the sand, and the best paella in the city.

### Gràcia
A former independent town with a village feel. Quiet plazas, local bars, and the colourful Festa Major in August.

## Where to Stay

- **Budget**: Generator Barcelona (El Born) — stylish hostel, rooftop bar
- **Mid-range**: Hotel Brummell (Poble Sec) — design hotel, pool, local feel
- **Luxury**: Hotel Arts Barcelona (Barceloneta) — beachfront, Michelin dining
- **Apartment**: Look in Eixample or Gràcia for the best value on Airbnb

## Food & Drink

Barcelona's food scene is one of the best in Europe. Don't miss:

- **La Boqueria Market** — fresh produce, juice bars, jamón counters
- **Pintxos bars in El Born** — Basque-style small plates, pay per skewer
- **Cal Pep** — legendary tapas counter near the waterfront
- **Cervecería Catalana** — locals queue for the patatas bravas

### What to Eat
- *Pa amb tomàquet* — bread rubbed with tomato and olive oil
- *Bombas* — fried potato balls with spicy sauce (Barceloneta speciality)
- *Fideuà* — like paella, but with short noodles instead of rice
- *Crema catalana* — the Catalan crème brûlée

### Drinks
- **Vermouth** — order a *vermut* at any traditional bar
- **Cava** — Catalan sparkling wine, cheaper and arguably better than Champagne
- **Estrella Damm** — the local beer

## Activities

### Must-Do
1. **La Sagrada Família** — book tickets 2–3 weeks ahead, go early morning
2. **Park Güell** — Gaudí's mosaic wonderland overlooking the city
3. **Gothic Quarter walking tour** — free tours leave from Plaça de Catalunya daily
4. **Barceloneta Beach** — swim, people-watch, grab a cold Estrella

### Hidden Gems
- **Bunkers del Carmel** — the best free viewpoint in Barcelona, sunset spot
- **Mercat de Sant Antoni** — Sunday book and vintage market
- **Hospital de Sant Pau** — Modernista masterpiece, fraction of the crowds of Sagrada Família
- **El Born Cultural Centre** — medieval ruins underneath a 19th-century market

### Day Trips
- **Montserrat** — dramatic mountain monastery, 1hr by train
- **Sitges** — charming coastal town, 35min south
- **Girona** — Game of Thrones filming location, colourful riverside houses

## Getting Around

- **Metro** — fast, cheap (€2.40 single / T-Casual 10-trip €11.35), covers most areas
- **Walking** — the best way in the old town
- **Bike** — flat city, good bike lanes, Bicing or rental shops
- **Bus** — useful for reaching Park Güell and hilltop spots
- **Taxi/Uber** — readily available, metered, reasonable fares

## Budget

| Category | Budget | Mid-Range | Luxury |
|----------|--------|-----------|--------|
| Accommodation | €25–50/night | €100–180/night | €250+/night |
| Meals | €10–15 | €25–40 | €60+ |
| Transport | €11/10 rides | €11/10 rides | €15–25 taxi |
| Activities | €15–30/day | €30–50/day | €50+/day |
| **Daily Total** | **€60–100** | **€165–270** | **€375+** |

## Safety

Barcelona is generally safe, but **pickpocketing is very common**, especially on La Rambla, in the metro, and at the beach. Keep valuables in a front pocket or cross-body bag. Avoid the southern end of La Rambla late at night.

Emergency number: **112** (EU-wide)
`,
    tags: ["beach", "culture", "architecture", "food", "nightlife"],
    published: true,
    status: "published",
    created_at: "2026-02-15T10:00:00Z",
    updated_at: "2026-03-17T14:30:00Z",
    updated_by_name: "DestinationBot",
  },
  {
    id: "2",
    slug: "tokyo",
    name: "Tokyo",
    country: "Japan",
    continent: "Asia",
    hero_image_url:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
    summary:
      "An electrifying metropolis where ancient temples sit beside neon-lit skyscrapers, and every meal is an event.",
    content_markdown: `## Overview

Tokyo is a city of contrasts — serene Shinto shrines share blocks with flashing Akihabara arcades, and Michelin-starred sushi counters sit alongside ramen joints that haven't changed in 50 years. With 14 million people in the city proper and 37 million in the metro area, it's the world's most populous urban zone — yet somehow feels orderly, clean, and navigable.

## When to Visit

**Late March–April** (cherry blossom season) and **November** (autumn foliage) are the most spectacular times. Summer is hot and humid; winter is cold but dry with fewer tourists.

| Season | Temp (°C) | Crowd Level | Notes |
|--------|-----------|-------------|-------|
| Spring (Mar–May) | 10–22 | Very High | Cherry blossoms in late March/early April |
| Summer (Jun–Aug) | 22–33 | High | Humid, festival season |
| Autumn (Sep–Nov) | 12–25 | High | Stunning foliage, comfortable |
| Winter (Dec–Feb) | 2–10 | Low | Cold, clear skies, cheap |

## Neighbourhoods

### Shinjuku
The neon-lit commercial hub. Tokyo's busiest station, the red-light district of Kabukichō, the skyscraper observation decks, and the quiet oasis of Shinjuku Gyoen garden.

### Shibuya
Youth culture central. The famous Shibuya Crossing, Hachikō statue, and endless shopping. Neighbouring Harajuku is ground zero for street fashion.

### Asakusa
Old-world Tokyo. Sensō-ji temple, rickshaw rides, traditional craft shops, and street food along Nakamise-dōri.

### Akihabara
Electric Town — anime, manga, electronics, and maid cafés. Sensory overload in the best way.

### Roppongi
Nightlife and contemporary art. Roppongi Hills, the Mori Art Museum, and clubs that run until dawn.

## Where to Stay

- **Budget**: Nui. Hostel (Kuramae) — beautiful converted warehouse
- **Mid-range**: Hotel Gracery Shinjuku — Godzilla on the roof, great location
- **Luxury**: Park Hyatt Tokyo (Shinjuku) — the Lost in Translation hotel
- **Capsule**: Nine Hours Shinjuku — sleek, modern capsule hotel experience

## Food & Drink

Tokyo has more Michelin stars than any other city on Earth. But the best food is often the cheapest.

### Must-Try
- **Ramen** — Ichiran (solo booth ramen), Fuunji (tsukemen), or any random shop with a queue
- **Sushi** — Tsukiji or Toyosu outer market for breakfast sushi
- **Tonkatsu** — Maisen in Omotesando, crispy pork cutlet perfection
- **Yakitori** — Memory Lane (Omoide Yokochō) in Shinjuku, tiny grilled-chicken stalls

### Drinking
- **Golden Gai** (Shinjuku) — 200+ tiny bars, each seating 6–8 people
- **Highball bars** — Japanese whisky + soda, the national drink
- **Convenience store** — Strong Zero, chu-hi, and surprisingly excellent onigiri at 3am

## Activities

### Must-Do
1. **Sensō-ji at dawn** — arrive before 7am for the temple to yourself
2. **Shibuya Crossing** — watch from the Starbucks above, then cross it yourself
3. **Teamlab Borderless** — immersive digital art, book in advance
4. **Tsukiji/Toyosu outer market** — tuna, tamagoyaki, and fresh uni for breakfast

### Hidden Gems
- **Shimokitazawa** — vintage shops, live music venues, Tokyo's bohemian quarter
- **Yanaka** — old-fashioned neighbourhood that survived the war, cat street
- **Odaiba** — futuristic island with a giant Gundam, teamLab, and seaside walks
- **Meiji Jingū inner garden** — serene iris garden inside the famous shrine

### Day Trips
- **Kamakura** — Great Buddha, bamboo groves, 1hr from Tokyo
- **Hakone** — hot springs with Mt Fuji views
- **Nikko** — ornate shrines in mountain forests

## Getting Around

- **Train/Metro** — the best system in the world. Get a Suica or Pasmo IC card
- **Yamanote Line** — the loop line connecting all major districts
- **Walking** — essential for exploring neighbourhoods
- **Taxi** — clean, safe, but expensive. Doors open automatically

> **Tip**: Buy a 72-hour Tokyo Subway Ticket (¥1,500) if you'll ride the metro a lot.

## Budget

| Category | Budget | Mid-Range | Luxury |
|----------|--------|-----------|--------|
| Accommodation | ¥3,000–6,000 | ¥12,000–25,000 | ¥40,000+ |
| Meals | ¥1,500–3,000 | ¥5,000–10,000 | ¥20,000+ |
| Transport | ¥800–1,500 | ¥800–1,500 | ¥3,000+ taxi |
| Activities | ¥1,000–3,000 | ¥3,000–6,000 | ¥10,000+ |
| **Daily Total** | **¥6,300–13,500** | **¥20,800–42,500** | **¥73,000+** |

*At ~¥150/£1 or ~¥155/$1 (March 2026)*

## Safety

Tokyo is one of the safest major cities in the world. Violent crime is extremely rare. Lost property is almost always returned. The main risks are earthquakes (follow building evacuation guides) and the occasional typhoon in late summer.

Emergency number: **110** (police) / **119** (fire/ambulance)
`,
    tags: ["culture", "food", "technology", "temples", "shopping"],
    published: true,
    status: "published",
    created_at: "2026-02-20T10:00:00Z",
    updated_at: "2026-03-16T09:15:00Z",
    updated_by_name: "TravelWriterBot",
  },
  {
    id: "3",
    slug: "marrakech",
    name: "Marrakech",
    country: "Morocco",
    continent: "Africa",
    hero_image_url:
      "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&q=80",
    summary:
      "A sensory feast of spice-scented souks, ornate riads, and the chaotic magic of Jemaa el-Fnaa square.",
    content_markdown: `## Overview

Marrakech is Morocco's most intoxicating city — a place where the call to prayer mingles with the cries of market vendors, and every alleyway in the medina leads somewhere unexpected. The old city (medina) is a UNESCO World Heritage Site, a labyrinth of terracotta walls hiding exquisite courtyards, hammams, and rooftop terraces with Atlas Mountain views.

## When to Visit

**March–May** and **October–November** are ideal. Summer is scorching (40°C+), and Ramadan dates shift annually — the city is quieter but many restaurants close during the day.

## Neighbourhoods

### Medina
The ancient walled city. Get lost on purpose — it's the whole point. The souks radiate out from Jemaa el-Fnaa square.

### Gueliz
The French-built new town. Wider streets, contemporary galleries, cocktail bars, and international restaurants.

### Kasbah
Home to the Saadian Tombs and El Badi Palace ruins. Quieter, more residential.

## Where to Stay

- **Budget**: Equity Point Hostel — rooftop pool, medina location
- **Mid-range**: Riad Yasmine — Instagram-famous courtyard pool, boutique charm
- **Luxury**: La Mamounia — legendary palace hotel, Yves Saint Laurent's favourite

## Food & Drink

- **Tagine** — slow-cooked stew (lamb with prunes, chicken with preserved lemon)
- **Couscous** — traditionally eaten on Fridays
- **Pastilla** — sweet-savoury pastry with pigeon or chicken
- **Mint tea** — poured from a height, impossibly sweet, served everywhere

## Activities

1. **Jemaa el-Fnaa at dusk** — snake charmers, storytellers, food stalls
2. **Bahia Palace** — intricate tilework and painted cedar ceilings
3. **Jardin Majorelle** — Yves Saint Laurent's cobalt-blue garden
4. **Hammam** — traditional steam bath (try Heritage Spa for tourists)
5. **Atlas Mountains day trip** — Berber villages, Ourika Valley waterfalls

## Getting Around

- **Walking** — the only way in the medina
- **Petit taxi** — orange taxis for short hops, insist on the meter
- **Calèche** — horse-drawn carriages, agree the price first
- **Uber** — doesn't exist, use InDriver or Careem

## Budget

A budget traveller can do Marrakech on **€30–50/day**. Mid-range is **€80–150/day**. A luxury riad experience runs **€200+/day**.

## Safety

Marrakech is safe for tourists but the hustle is real. You will be approached by "guides" trying to lead you somewhere for a tip. Politely decline and keep walking. Women should dress modestly in the medina (shoulders and knees covered). Haggle hard in the souks — the first price is typically 3–5x what you should pay.
`,
    tags: ["culture", "food", "history", "markets", "adventure"],
    published: true,
    status: "published",
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-15T11:45:00Z",
    updated_by_name: "DestinationBot",
  },
  {
    id: "4",
    slug: "reykjavik",
    name: "Reykjavik",
    country: "Iceland",
    continent: "Europe",
    hero_image_url:
      "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200&q=80",
    summary:
      "The world's northernmost capital — a gateway to volcanoes, glaciers, hot springs, and the Northern Lights.",
    content_markdown: `## Overview

Reykjavik is a tiny capital with an outsized personality. With just 130,000 people, it feels more like a creative village than a city — colourful corrugated houses, world-class restaurants, and a thriving music scene. But the real draw is what surrounds it: some of the most dramatic landscapes on Earth.

## When to Visit

- **Northern Lights**: September–March (dark skies needed)
- **Midnight Sun**: June–July (24hr daylight, highland roads open)
- **Best balance**: September — fewer crowds, autumn colours, Northern Lights starting

## Activities

1. **Golden Circle** — Þingvellir, Geysir, Gullfoss waterfall (day trip)
2. **Blue Lagoon** — geothermal spa, book weeks in advance
3. **Whale watching** — from Reykjavik harbour, best June–August
4. **Hallgrímskirkja** — the iconic church, observation tower views
5. **South Coast** — Seljalandsfoss, Skógafoss, black sand beach at Vík

## Budget

Iceland is expensive. Budget travellers should expect **€100–150/day**, mid-range **€200–350/day**, and luxury **€500+/day**. Cook at the hostel and buy from Bónus supermarket to save money.

## Safety

Iceland is one of the safest countries in the world. The main dangers are natural: respect the weather, stay on marked trails, and never drive in conditions you're not equipped for. The emergency number is **112**.
`,
    tags: ["nature", "adventure", "northern-lights", "hot-springs"],
    published: true,
    status: "published",
    created_at: "2026-03-05T10:00:00Z",
    updated_at: "2026-03-14T16:00:00Z",
    updated_by_name: "TravelWriterBot",
  },
  {
    id: "5",
    slug: "buenos-aires",
    name: "Buenos Aires",
    country: "Argentina",
    continent: "South America",
    hero_image_url:
      "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&q=80",
    summary:
      "The Paris of South America — tango, steak, street art, and a nightlife that doesn't start until 2am.",
    content_markdown: `## Overview

Buenos Aires is a city that lives late and loves hard. European architecture lines wide boulevards, milongas host tango until dawn, and the asado culture means there's always a grill smoking somewhere. The peso makes it exceptionally affordable for foreign visitors right now.

## When to Visit

**March–May** (autumn) and **September–November** (spring) offer the best weather. Summer (Dec–Feb) is hot and humid; many porteños leave for the coast.

## Neighbourhoods

### San Telmo
Cobblestones, antique markets, tango in the streets. The Sunday Feria de San Telmo is unmissable.

### Palermo
The biggest barrio — split into Palermo Soho (boutiques, brunch), Palermo Hollywood (restaurants, bars), and the parks.

### La Boca
The colourful Caminito street, Boca Juniors stadium, and street tango. Visit by day only.

### Recoleta
Elegant, Parisian. The famous cemetery, stunning parks, and upmarket dining.

## Food & Drink

- **Asado** — Argentine BBQ, the national obsession. Try Don Julio or any neighbourhood parrilla
- **Empanadas** — baked or fried, meat or cheese. La Cocina is a local favourite
- **Dulce de leche** — on everything: ice cream, medialunas, alfajores
- **Malbec** — Argentina's signature red wine, absurdly good and cheap

## Activities

1. **Tango show + milonga** — watch a show at Café de los Angelitos, then dance at La Catedral
2. **Recoleta Cemetery** — find Evita's tomb among ornate mausoleums
3. **Feria de San Telmo** — Sunday market stretching for blocks
4. **MALBA** — Latin American art museum in Palermo
5. **La Bombonera** — catch a Boca Juniors match (the atmosphere is unmatched)

## Budget

Buenos Aires is very affordable for Western visitors. Budget: **$30–50/day**, mid-range: **$80–150/day**, luxury: **$200+/day**.

## Safety

Exercise normal caution. Petty theft is common in tourist areas — don't flash expensive phones. Use Uber or Cabify instead of hailing random taxis. Avoid La Boca after dark.
`,
    tags: ["culture", "food", "nightlife", "tango", "street-art"],
    published: true,
    status: "published",
    created_at: "2026-03-08T10:00:00Z",
    updated_at: "2026-03-13T10:20:00Z",
    updated_by_name: "DestinationBot",
  },
];

const MOCK_API_KEYS: ApiKey[] = [
  {
    id: "k1",
    name: "DestinationBot",
    prefix: "sk_heha_a3f8...",
    auto_publish: true,
    created_at: "2026-02-10T10:00:00Z",
    last_used_at: "2026-03-17T14:30:00Z",
    revoked: false,
  },
  {
    id: "k2",
    name: "TravelWriterBot",
    prefix: "sk_heha_7b2e...",
    auto_publish: false,
    created_at: "2026-02-15T10:00:00Z",
    last_used_at: "2026-03-16T09:15:00Z",
    revoked: false,
  },
];

const MOCK_HISTORY: ContentHistoryEntry[] = [
  {
    id: "h1",
    destination_slug: "barcelona",
    action: "update",
    actor_type: "bot",
    actor_name: "DestinationBot",
    created_at: "2026-03-17T14:30:00Z",
  },
  {
    id: "h2",
    destination_slug: "tokyo",
    action: "update",
    actor_type: "bot",
    actor_name: "TravelWriterBot",
    created_at: "2026-03-16T09:15:00Z",
  },
  {
    id: "h3",
    destination_slug: "marrakech",
    action: "create",
    actor_type: "bot",
    actor_name: "DestinationBot",
    created_at: "2026-03-15T11:45:00Z",
  },
  {
    id: "h4",
    destination_slug: "reykjavik",
    action: "create",
    actor_type: "bot",
    actor_name: "TravelWriterBot",
    created_at: "2026-03-14T16:00:00Z",
  },
  {
    id: "h5",
    destination_slug: "buenos-aires",
    action: "create",
    actor_type: "bot",
    actor_name: "DestinationBot",
    created_at: "2026-03-13T10:20:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USE_MOCK = !API_URL;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) throw new Error("No API URL configured");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export interface DestinationFilters {
  continent?: string;
  tag?: string;
  q?: string;
  status?: string;
}

export async function fetchDestinations(
  filters?: DestinationFilters
): Promise<Destination[]> {
  if (USE_MOCK) {
    let results = MOCK_DESTINATIONS;
    if (filters?.continent)
      results = results.filter((d) => d.continent === filters.continent);
    if (filters?.tag)
      results = results.filter((d) => d.tags.includes(filters.tag!));
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      results = results.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q)
      );
    }
    if (filters?.status)
      results = results.filter((d) => d.status === filters.status);
    return results;
  }
  const params = new URLSearchParams();
  if (filters?.continent) params.set("continent", filters.continent);
  if (filters?.tag) params.set("tag", filters.tag);
  if (filters?.q) params.set("q", filters.q);
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  return apiFetch<Destination[]>(`/destinations${qs ? `?${qs}` : ""}`);
}

export async function fetchDestination(
  slug: string
): Promise<Destination | null> {
  if (USE_MOCK) {
    return MOCK_DESTINATIONS.find((d) => d.slug === slug) ?? null;
  }
  return apiFetch<Destination>(`/destinations/${slug}`);
}

// ---------------------------------------------------------------------------
// Admin — Destinations
// ---------------------------------------------------------------------------

export async function createDestination(
  data: Partial<Destination>
): Promise<Destination> {
  if (USE_MOCK) throw new Error("Mock: cannot create");
  return apiFetch<Destination>("/destinations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDestination(
  slug: string,
  data: Partial<Destination>
): Promise<Destination> {
  if (USE_MOCK) throw new Error("Mock: cannot update");
  return apiFetch<Destination>(`/destinations/${slug}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function publishDestination(slug: string): Promise<void> {
  if (USE_MOCK) throw new Error("Mock: cannot publish");
  await apiFetch(`/destinations/${slug}/publish`, { method: "POST" });
}

export async function reviewContent(
  id: string,
  action: "approve" | "reject"
): Promise<void> {
  if (USE_MOCK) throw new Error("Mock: cannot review");
  await apiFetch(`/review/${id}`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

export async function fetchApiKeys(): Promise<ApiKey[]> {
  if (USE_MOCK) return MOCK_API_KEYS;
  return apiFetch<ApiKey[]>("/keys");
}

export async function createApiKey(
  name: string,
  config: { auto_publish: boolean }
): Promise<{ key: string } & ApiKey> {
  if (USE_MOCK) throw new Error("Mock: cannot create key");
  return apiFetch("/keys", {
    method: "POST",
    body: JSON.stringify({ name, ...config }),
  });
}

export async function revokeApiKey(id: string): Promise<void> {
  if (USE_MOCK) throw new Error("Mock: cannot revoke");
  await apiFetch(`/keys/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Content History
// ---------------------------------------------------------------------------

export async function fetchContentHistory(
  slug?: string
): Promise<ContentHistoryEntry[]> {
  if (USE_MOCK) {
    if (slug) return MOCK_HISTORY.filter((h) => h.destination_slug === slug);
    return MOCK_HISTORY;
  }
  const qs = slug ? `?slug=${slug}` : "";
  return apiFetch<ContentHistoryEntry[]>(`/history${qs}`);
}

// ---------------------------------------------------------------------------
// Admin Stats
// ---------------------------------------------------------------------------

export async function fetchAdminStats(): Promise<AdminStats> {
  if (USE_MOCK) {
    return {
      total_destinations: MOCK_DESTINATIONS.length,
      published_destinations: MOCK_DESTINATIONS.filter((d) => d.published)
        .length,
      active_bots: MOCK_API_KEYS.filter((k) => !k.revoked).length,
      pending_reviews: 0,
      recent_updates: MOCK_HISTORY.length,
    };
  }
  return apiFetch<AdminStats>("/admin/stats");
}
