# Content Generation Skills — Destination Pages

> Blueprint for generating AI-discoverable destination guides that integrate Holiday Extras products naturally. These pages are stored in the CMS `pages` table and served at `/<lang>/<slug>`.

---

## Table of Contents

1. [CMS Integration](#cms-integration)
2. [AI Discovery Principles](#ai-discovery-principles)
3. [Page Template](#page-template)
4. [Product Integration Patterns](#product-integration-patterns)
5. [Data Source Mapping](#data-source-mapping)
6. [Schema.org Templates](#schemaorg-templates)
7. [Worked Example: Barcelona](#worked-example-barcelona)

---

## CMS Integration

Destination pages are stored as rows in the CMS `pages` table with `template_key: "destination"`. The content generation process produces markdown that goes into the `content_markdown` field.

### How Destination Pages Map to the CMS

| CMS Field | Destination Page Source |
|-----------|----------------------|
| `lang` | Target language (e.g. `en`, `fr`, `de`) |
| `slug` | City name, lowercase with hyphens (e.g. `barcelona`) |
| `title` | City name (e.g. "Barcelona Travel Guide") |
| `page_title` | SEO title — max 70 chars (e.g. "Barcelona Travel Guide 2026 — Everything You Need to Know") |
| `description` | Meta description — max 160 chars |
| `content_markdown` | Full generated markdown following the template below |
| `template_key` | `"destination"` |
| `status` | `"published"` |

### URL Structure

Destination pages follow the CMS multilingual URL convention:

- **English:** `/en/barcelona`
- **French:** `/fr/barcelone`
- **German:** `/de/barcelona`

Each language version is a separate page — same slug can exist independently across languages. See `/skills.md` for full CMS routing rules.

---

## AI Discovery Principles

Every destination page must follow these rules to maximise visibility in AI search, LLM retrieval, and featured snippets.

### 1. Answer-First

Open every section with a direct answer in the first 1–2 sentences. No preamble, no "In this section we will discuss…". The opening sentence should be usable as a standalone answer.

**Good:** "Barcelona's primary airport is El Prat (BCN), 12 km southwest of the city centre. The Aerobus runs every 5 minutes to Plaça Catalunya for EUR 7.75."

**Bad:** "When planning a trip to Barcelona, one of the first things you'll want to know about is the airport situation."

### 2. Q&A Structure

Use real traveller questions as H2/H3 headings. These map directly to how people search and how AI systems extract answers.

**Good:** `## How do I get from Barcelona airport to the city centre?`

**Bad:** `## Airport Transport Information`

### 3. Authority Signals

- Cite sources inline: "According to the UK FCDO…", "Spain's tourism board reports…"
- Include "Last updated: YYYY-MM-DD" in the page metadata
- Reference specific data: "EUR 7.75" not "a few euros"; "12 km" not "a short distance"
- Link to official sources where available

### 4. Conversational but Precise Tone

Write as a knowledgeable friend who happens to have exact figures. Avoid both dry bureaucratic language and overly casual slang.

**Good:** "You'll need euros in Barcelona. Most restaurants accept cards, but market stalls at La Boqueria are often cash-only. ATMs charge around EUR 2–4 per withdrawal."

**Bad:** "The currency is EUR. Credit cards are widely accepted."

### 5. Depth over Volume

One comprehensive, authoritative guide per destination. Every section should be thorough enough that a traveller doesn't need to search elsewhere. Prefer 2,000–4,000 words of substance over 500 words of fluff.

### 6. Structured Data First

Every page must include Schema.org JSON-LD (FAQPage, Article, BreadcrumbList). This is non-negotiable — it directly affects AI and search engine understanding.

---

## Page Template

Each destination page consists of the following sections, in order. Sections marked **(conditional)** are included only when relevant data is available. Sections marked **(optional)** can be omitted.

### 1. Hero & Quick Facts

One-sentence destination summary followed by a structured facts grid.

**Required fields:**
| Field | Source | Example |
|-------|--------|---------|
| Currency | `destinations.currency_code` + `currency_name` | EUR (Euro) |
| Language | `destinations.primary_language` | Spanish (Catalan also widely spoken) |
| Timezone | `destinations.timezone` | CET (UTC+1) |
| Driving side | `destinations.driving_side` | Right |
| Calling code | `destinations.calling_code` | +34 |
| Best season | `destinations.popular_seasons` | Apr–Jun, Sep–Oct |
| Advisory level | `destinations.travel_advisories` | Level 1 — Exercise Normal Precautions |

**Content pattern:**
```
Barcelona is Spain's vibrant Mediterranean port city, known for Gaudí's
architecture, beach culture, and world-class food. Here's everything you
need to know before you go.

[Quick Facts Grid]
```

### 2. Getting There

Airport information, transport options from airport to city, with prices and journey durations.

**Structure:**
- Primary airport name, IATA code, distance from city
- Transport options table: mode, duration, cost, frequency
- Tips for families, budget travellers, late arrivals

**Products:** transfers, car hire

**Content pattern:**
```
## How do I get from [airport] to [city]?

[Airport] ([IATA]) is [distance] from [city] centre.

| Transport | Duration | Cost | Frequency |
|-----------|----------|------|-----------|
| Aerobus   | 35 min   | EUR 7.75 | Every 5 min |
| Metro L9  | 45 min   | EUR 5.15 | Every 7 min |
| Taxi      | 25 min   | EUR 39 (fixed) | On demand |

> **Need a stress-free arrival?** Compare airport transfer options to [city]
> for private cars, shared shuttles, and meet-and-greet services.

> **Want to explore at your own pace?** Compare car hire options at [airport]
> for the best deals on rental vehicles.
```

### 3. Airport Services

Terminal information, facilities, and airport-specific services.

**Structure:**
- Terminal overview (count, which airlines use which terminal)
- Key facilities: Wi-Fi, lounges, restaurants, shops
- Security wait time estimates
- Night-before stay options

**Products:** parking, lounges, hotels, hotel+parking bundles

**Content pattern:**
```
## What facilities are available at [airport]?

[Airport] has [N] terminals. [Airline details].

### Terminal Facilities
- **Wi-Fi:** [quality] — [pricing]
- **Security:** Average wait [X] minutes; [peak info]
- **Lounges:** [available lounges]

> **Flying early?** Book an airport hotel the night before your flight
> and start your holiday stress-free. Hotel + parking bundles save up to 30%.

> **Skip the crowds.** Airport lounge access includes complimentary food,
> drinks, and Wi-Fi — compare lounge options at [airport].

> **Driving to the airport?** Compare airport parking options at [airport]
> — from budget long-stay to premium meet-and-greet.
```

### 4. Best Time to Visit

Month-by-month weather data, peak/off-peak seasons, and notable events.

**Structure:**
- Summary: best months and why
- Weather table: month, high °C, low °C, rain chance %, condition
- Peak vs off-peak comparison
- Key events/festivals by month

**Data source:** `destinations.weather_averages`, `destinations.popular_seasons`

**Content pattern:**
```
## When is the best time to visit [city]?

The best time to visit [city] is [months] when [reason].

### Monthly Weather Averages

| Month | High °C | Low °C | Rain % | Conditions |
|-------|---------|--------|--------|------------|
| Jan   | 14      | 6      | 35     | Cool, occasional rain |
| Feb   | 15      | 7      | 30     | Mild, drier |
| ...   | ...     | ...    | ...    | ...        |

### Peak Season ([months])
[Description of peak — prices, crowds, weather]

### Off-Peak Season ([months])
[Description of off-peak — value, fewer crowds, weather trade-offs]
```

### 5. Travel Essentials

Visa requirements, health information, safety, emergency contacts, and embassy details.

**Structure:**
- Visa requirements (by nationality — default UK)
- Health: vaccinations, tap water, pharmacies
- Safety: general advice, areas to avoid, scam warnings
- Emergency numbers: police, ambulance, fire
- UK embassy/consulate address and phone

**Products:** insurance

**Content pattern:**
```
## Do I need a visa for [country]?

[Visa information for UK passport holders.]

### Health & Safety
[Key health info, tap water safety, pharmacy availability]

### Emergency Numbers
- Police: [number]
- Ambulance: [number]
- Fire: [number]
- UK Embassy: [address, phone]

> **Travel insurance gives you peace of mind.** Compare single-trip and
> annual multi-trip policies — covering medical emergencies, cancellations,
> and lost luggage.
```

### 6. Getting Around

Local transport within the destination — public transit, taxis, walking, cycling.

**Structure:**
- Public transport overview: metro, bus, tram
- Tourist passes/cards with prices
- Taxi info: apps, typical fares
- Walking and cycling notes

**Products:** car hire

**Content pattern:**
```
## How do I get around [city]?

[City]'s public transport network includes [modes]. A [tourist card] costs
[price] for [duration] and covers [services].

### Public Transport
[Details on metro, bus, tram]

### Taxis & Ride-hailing
[Apps available, typical fares, tipping]

### Walking & Cycling
[Walkability, bike-share schemes, key cycling routes]

> **Want more freedom?** Compare car hire options for day trips to [nearby
> destinations] — explore the [region] coast or countryside at your own pace.
```

### 7. Where to Stay (conditional)

Included when the destination has well-known neighbourhoods. Neighbourhood guide with character descriptions and price indications.

**Structure:**
- 3–5 neighbourhoods with character, pros/cons, price range
- Best for: families, couples, nightlife, budget, etc.

**Products:** hotels

**Content pattern:**
```
## Where should I stay in [city]?

### [Neighbourhood 1]
**Best for:** [type of traveller]
[Description — character, highlights, transport links, price indication]

### [Neighbourhood 2]
...

> **Book your accommodation.** Compare hotel options in [city] — from
> boutique stays in the Gothic Quarter to beachfront apartments in
> Barceloneta.
```

### 8. FAQ Section

Minimum 8 question-and-answer pairs covering the most common traveller queries. Each answer must be at least 50 characters. FAQs must cover: weather, transport, safety, currency, language, tipping, and visa topics at minimum.

**Structure:**
- Each Q&A as a `<details>` element or structured FAQ block
- Questions phrased as real traveller queries
- Answers are concise but complete (2–4 sentences)

**Content pattern:**
```
## Frequently Asked Questions

### Is Barcelona safe for tourists?
Barcelona is generally safe for tourists. Petty theft — particularly
pickpocketing on Las Ramblas and the metro — is the main concern. Keep
valuables in a front pocket or cross-body bag, and be alert in crowded
tourist areas.

### Do I need to speak Spanish in Barcelona?
Most people in the tourism industry speak English. However, learning basic
Spanish or Catalan phrases (like "gràcies" for thank you) is appreciated
and will enrich your experience.

[... minimum 8 FAQs total]
```

### 9. Local Tips (optional)

Cultural norms, etiquette, and insider knowledge that helps travellers avoid faux pas.

**Content pattern:**
```
## Local Tips

- **Meal times:** Lunch is 2–4pm, dinner starts at 9pm. Restaurants
  serving at 7pm are tourist traps.
- **Siesta:** Some smaller shops close 2–5pm. Plan shopping accordingly.
- **Tipping:** Not expected but rounding up is appreciated. Leave EUR 1–2
  at restaurants if service was good.
- **Greetings:** Two kisses on the cheek (right then left) is standard
  among friends.
```

---

## Product Integration Patterns

Products are integrated naturally within relevant sections. Never use aggressive sales language. The tone should be helpful — "if you need this, here's where to compare options."

### Airport Parking

| Attribute | Value |
|-----------|-------|
| **Product type** | `airport_parking` |
| **Appears in** | Airport Services (section 3) |
| **Trigger** | Destination has a primary departure airport |
| **Content pattern** | "Driving to the airport? Compare airport parking options at [airport] — from budget long-stay to premium meet-and-greet." |
| **CTA** | Compare airport parking options |

### Airport Hotels

| Attribute | Value |
|-----------|-------|
| **Product type** | `airport_hotel` |
| **Appears in** | Airport Services (section 3) |
| **Trigger** | Destination has a primary departure airport |
| **Content pattern** | "Flying early? Book an airport hotel the night before your flight and start your holiday stress-free. Hotel + parking bundles save up to 30%." |
| **CTA** | Compare airport hotel options |

### Airport Lounges

| Attribute | Value |
|-----------|-------|
| **Product type** | `airport_lounge` |
| **Appears in** | Airport Services (section 3) |
| **Trigger** | Destination has a primary departure airport |
| **Content pattern** | "Skip the crowds. Airport lounge access includes complimentary food, drinks, and Wi-Fi — compare lounge options at [airport]." |
| **CTA** | Compare airport lounge options |

### Car Hire

| Attribute | Value |
|-----------|-------|
| **Product type** | `car_hire` |
| **Appears in** | Getting There (section 2), Getting Around (section 6) |
| **Trigger** | Destination has road infrastructure / day-trip opportunities |
| **Content pattern (Getting There)** | "Want to explore at your own pace? Compare car hire options at [airport] for the best deals on rental vehicles." |
| **Content pattern (Getting Around)** | "Want more freedom? Compare car hire options for day trips to [nearby destinations]." |
| **CTA** | Compare car hire options |

### Travel Insurance

| Attribute | Value |
|-----------|-------|
| **Product type** | `travel_insurance` |
| **Appears in** | Travel Essentials (section 5) |
| **Trigger** | Always included |
| **Content pattern** | "Travel insurance gives you peace of mind. Compare single-trip and annual multi-trip policies — covering medical emergencies, cancellations, and lost luggage." |
| **CTA** | Compare travel insurance options |

### Airport Transfers

| Attribute | Value |
|-----------|-------|
| **Product type** | `airport_transfer` |
| **Appears in** | Getting There (section 2) |
| **Trigger** | Destination has a primary airport |
| **Content pattern** | "Need a stress-free arrival? Compare airport transfer options to [city] for private cars, shared shuttles, and meet-and-greet services." |
| **CTA** | Compare airport transfer options |

### Holiday Extras Bundles

| Attribute | Value |
|-----------|-------|
| **Product type** | `holiday_extras_bundle` |
| **Appears in** | Airport Services (section 3) |
| **Trigger** | Destination has a primary departure airport |
| **Content pattern** | "Get more for less — bundle airport parking with a hotel stay and save up to 30% compared to booking separately." |
| **CTA** | Compare bundle deals |

---

## Data Source Mapping

| Section | Primary Source | Fallback |
|---------|--------------|----------|
| Quick Facts — currency, language | `destinations.currency_code`, `currency_name`, `primary_language` | REST Countries API |
| Quick Facts — timezone, driving side, calling code | `destinations.timezone`, `driving_side`, `calling_code` | REST Countries API |
| Quick Facts — advisory level | `destinations.travel_advisories` | US State Department API |
| Weather averages | `destinations.weather_averages` | — (omit section if unavailable) |
| Popular seasons | `destinations.popular_seasons` | — (omit peak/off-peak if unavailable) |
| Airport info | `airports` table (IATA, terminals, facilities) | — (omit airport sections if unavailable) |
| Terminal details | `airports.terminal_info` JSON array | — |
| Security wait times | `airports.tsa_wait_avg_minutes` | — |
| Wi-Fi | `airports.wifi_available`, `wifi_quality` | — |

### REST Countries API Fallback

When Supabase `destinations` data is incomplete, fetch from `https://restcountries.com/v3.1/name/{country}`:

- `currencies` → currency code + name
- `languages` → language list
- `timezones[0]` → timezone
- `car.side` → driving side
- `idd.root` + `idd.suffixes[0]` → calling code
- `flags.svg` → flag URL

### Weather Averages Schema

The `destinations.weather_averages` JSON array follows this structure:
```json
[
  {
    "month": 1,
    "temp_high_c": 14,
    "temp_low_c": 6,
    "rain_chance_percent": 35,
    "condition": "Cool, occasional rain"
  }
]
```

---

## Schema.org Templates

### FAQPage

Wraps the FAQ section. Each Q&A pair becomes a `Question` entity with an `acceptedAnswer`.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Barcelona safe for tourists?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Barcelona is generally safe for tourists. Petty theft — particularly pickpocketing on Las Ramblas and the metro — is the main concern. Keep valuables in a front pocket or cross-body bag."
      }
    }
  ]
}
```

### Article

Wraps the entire destination page.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Barcelona Travel Guide 2026 — Everything You Need to Know",
  "description": "Complete Barcelona travel guide covering flights, weather, transport, visas, and airport services. Updated March 2026.",
  "datePublished": "2026-03-18",
  "dateModified": "2026-03-18",
  "author": {
    "@type": "Organization",
    "name": "Heha",
    "url": "https://heha.ai"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Heha",
    "url": "https://heha.ai"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://heha.ai/en/barcelona"
  }
}
```

### BreadcrumbList

Navigation breadcrumbs for the page.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://heha.ai/en/index.html"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Spain",
      "item": "https://heha.ai/en/spain"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Barcelona",
      "item": "https://heha.ai/en/barcelona"
    }
  ]
}
```

---

## Worked Example: Barcelona

Below is a complete destination page demonstrating every section, product integration, and tone.

**CMS page record:**
| Field | Value |
|-------|-------|
| `lang` | `en` |
| `slug` | `barcelona` |
| `title` | Barcelona Travel Guide |
| `page_title` | Barcelona Travel Guide 2026 — Everything You Need to Know |
| `description` | Complete Barcelona travel guide covering flights, weather, transport, visas, and airport services. Updated March 2026. |
| `template_key` | `destination` |
| `status` | `published` |

**Public URL:** `/en/barcelona`

The `content_markdown` field contains the following:

---

### Hero & Quick Facts

Barcelona is Spain's vibrant Mediterranean port city, known for Gaudí's surreal architecture, golden beaches, and a food scene that runs from Michelin-starred restaurants to EUR 3 pintxos bars. Here's everything you need to know before you go.

| Fact | Value |
|------|-------|
| **Currency** | EUR (Euro) |
| **Language** | Spanish (Catalan also widely spoken) |
| **Timezone** | CET (UTC+1, CEST UTC+2 in summer) |
| **Driving side** | Right |
| **Calling code** | +34 |
| **Best season** | April–June, September–October |
| **Advisory level** | Level 1 — Exercise Normal Precautions |

---

### Getting There

#### How do I get from Barcelona airport to the city centre?

Barcelona–El Prat Airport (BCN) is 12 km southwest of the city centre. It handles over 50 million passengers annually across two terminals (T1 and T2).

| Transport | Duration | Cost | Frequency | Notes |
|-----------|----------|------|-----------|-------|
| Aerobus | 35 min | EUR 7.75 one-way | Every 5 min | Direct to Plaça Catalunya |
| Metro L9 Sud | 45 min | EUR 5.15 | Every 7 min | Connects to L1/L3 at Zona Universitària |
| RENFE train | 25 min | EUR 4.60 | Every 30 min | T2 only — free shuttle from T1 |
| Taxi | 20–30 min | EUR 39 (fixed rate) | On demand | Fixed fare to city centre |
| Private transfer | 20–30 min | From EUR 45 | Pre-booked | Door-to-door, meet at arrivals |

**Tip for families:** The Aerobus has luggage racks and runs until 1am. For groups of 3+, a taxi at the fixed EUR 39 rate often works out cheaper than individual Aerobus tickets.

**Late arrival?** The N17 night bus runs every 20 minutes and costs EUR 2.55.

> **Need a stress-free arrival?** Compare airport transfer options to Barcelona for private cars, shared shuttles, and meet-and-greet services.

> **Want to explore at your own pace?** Compare car hire options at Barcelona El Prat for the best deals on rental vehicles.

---

### Airport Services

#### What facilities are available at Barcelona El Prat?

Barcelona El Prat has two terminals. T1 is the main terminal handling most international and major carriers (British Airways, Vueling, Iberia, Ryanair international). T2 has three satellite buildings (T2A, T2B, T2C) used primarily by budget carriers.

#### Terminal Facilities

- **Wi-Fi:** Free unlimited Wi-Fi throughout both terminals. Speed is moderate — fine for messaging and email, slow for video calls.
- **Security:** Average wait 15–20 minutes. Peak times (6–8am, 2–5pm) can reach 30+ minutes. T1 has Fast Track security available.
- **Charging:** USB and power outlets available at most gates in T1. T2 has fewer — bring a portable charger.
- **Children:** Play areas in T1 (gates B and D zones).

> **Driving to the airport?** Compare airport parking options at Barcelona El Prat — from budget long-stay to premium meet-and-greet.

> **Skip the crowds.** Airport lounge access includes complimentary food, drinks, and Wi-Fi — compare lounge options at Barcelona El Prat.

> **Flying early?** Book an airport hotel the night before your flight and start your holiday stress-free. Hotel + parking bundles save up to 30%.

> **Get more for less** — bundle airport parking with a hotel stay and save up to 30% compared to booking separately.

---

### Best Time to Visit

#### When is the best time to visit Barcelona?

The best time to visit Barcelona is April–June and September–October when temperatures are warm (20–27°C), rainfall is low, and crowds are more manageable than in the July–August peak.

#### Monthly Weather Averages

| Month | High °C | Low °C | Rain % | Conditions |
|-------|---------|--------|--------|------------|
| Jan | 14 | 6 | 35 | Cool, occasional rain |
| Feb | 15 | 7 | 30 | Mild, drier |
| Mar | 17 | 9 | 25 | Spring arriving, pleasant |
| Apr | 19 | 11 | 30 | Warm, occasional showers |
| May | 22 | 14 | 25 | Ideal — warm and dry |
| Jun | 26 | 18 | 20 | Hot, sunny, long days |
| Jul | 29 | 21 | 15 | Peak heat, busy beaches |
| Aug | 29 | 21 | 20 | Hottest, most crowded |
| Sep | 27 | 19 | 30 | Warm, sea still swimmable |
| Oct | 22 | 15 | 35 | Pleasant, fewer tourists |
| Nov | 17 | 10 | 30 | Cool, quiet season begins |
| Dec | 14 | 7 | 30 | Cool, Christmas markets |

#### Peak Season (July–August)

Temperatures hit 29°C+, beaches are packed, and accommodation prices are 40–60% higher than shoulder season. La Mercè festival (late September) also drives a smaller peak. Book flights and hotels at least 2 months ahead.

#### Off-Peak Season (November–February)

Temperatures drop to 10–17°C and some beach bars close, but museum queues shrink dramatically and hotel prices drop 30–40%. Barcelona's Christmas markets (Fira de Santa Llúcia) run late November through December 23.

#### Notable Events

- **February:** Carnival celebrations, Llum BCN light festival
- **April:** Sant Jordi (April 23) — roses and books on every corner
- **June:** Sant Joan (June 23) — fireworks and bonfires on the beach
- **September:** La Mercè — Barcelona's biggest street festival
- **December:** Fira de Santa Llúcia Christmas market

---

### Travel Essentials

#### Do I need a visa for Spain?

UK passport holders do not need a visa for stays up to 90 days within a 180-day period (Schengen zone rules). Your passport must be valid for at least 3 months beyond your planned departure date and issued within the previous 10 years. From 2026, UK travellers will need an approved ETIAS authorisation (EUR 7, valid 3 years).

#### Health & Safety

- **Tap water:** Safe to drink throughout Barcelona
- **Pharmacies:** Identified by a green cross. At least one open 24/7 in each district — check farmaciesdeguardia.com
- **Healthcare:** Present your UK Global Health Insurance Card (GHIC) at public hospitals for reduced-cost treatment. Private treatment is not covered — travel insurance is strongly recommended
- **Sun:** UV index reaches 9–10 in summer. Wear SPF 30+ and avoid midday sun (1–4pm)

#### Safety

Barcelona is generally safe but has Spain's highest rate of pickpocketing. High-risk areas:
- **Las Ramblas** — especially near La Boqueria market entrance
- **Metro** (lines L1, L3, L4 during rush hour)
- **Beach** — don't leave belongings unattended
- **Plaça Reial** at night

Keep valuables in a front pocket or cross-body bag. Use the hotel safe for passports and spare cards.

#### Emergency Numbers

| Service | Number |
|---------|--------|
| All emergencies | 112 |
| National police | 091 |
| Local police (Mossos) | 088 |
| Ambulance | 061 |
| Fire | 080 |
| UK Consulate Barcelona | +34 933 666 200 |
| UK Consulate address | Avinguda Diagonal 477, 13th floor |

> **Travel insurance gives you peace of mind.** Compare single-trip and annual multi-trip policies — covering medical emergencies, cancellations, and lost luggage.

---

### Getting Around

#### How do I get around Barcelona?

Barcelona's public transport is excellent. A T-Casual card (EUR 11.35) gives you 10 trips across metro, bus, tram, and RENFE local trains within Zone 1.

#### Public Transport

- **Metro:** 8 lines, runs 5am–midnight (24h on Fridays/Saturdays). Covers all major sights — Sagrada Família (L2/L5), Barceloneta beach (L4), Camp Nou (L3/L5)
- **Bus:** Extensive network including the tourist Bus Turístic (EUR 30/day, 2 routes). Night buses (NitBus) run midnight–5am
- **Tram:** Useful for reaching Diagonal Mar and Esplugues areas
- **FGC trains:** Best for Montserrat day trips (R5 line, ~1h, EUR 23 return with rack railway)

#### Taxis & Ride-hailing

- **Taxis:** Black and yellow. Metered. Airport to city EUR 39 fixed. Flag drop EUR 2.50, then EUR 1.21/km
- **Apps:** FreeNow (formerly MyTaxi), Cabify. Uber operates in Barcelona but availability varies
- **Tipping:** Not expected. Rounding up to the nearest euro is common

#### Walking & Cycling

Barcelona is walkable — the Gothic Quarter to Barceloneta beach is a 15-minute stroll. The Bicing bike-share system requires a local address, but tourist rental bikes are available at EUR 10–15/day from shops on Passeig Marítim.

> **Want more freedom?** Compare car hire options for day trips to the Costa Brava, Montserrat, or the Penedès wine region — explore Catalonia at your own pace.

---

### Where to Stay

#### Where should I stay in Barcelona?

##### Gothic Quarter (Barri Gòtic)
**Best for:** first-timers, history lovers, couples
The medieval heart of Barcelona with narrow streets, hidden squares, and the cathedral. Central location means you can walk to most sights. Expect some noise at night. Budget to mid-range: EUR 80–180/night.

##### Eixample
**Best for:** architecture fans, foodies, LGBTQ+ travellers
The grid-plan district is home to Sagrada Família, Casa Batlló, and some of Barcelona's best restaurants. The "Gaixample" area around Carrer del Consell de Cent is the LGBTQ+ hub. Mid-range to upscale: EUR 120–250/night.

##### Barceloneta
**Best for:** beach lovers, seafood fans
Former fishing village with a long sandy beach, seafood restaurants, and a lively atmosphere. Gets very busy in summer. Budget to mid-range: EUR 70–160/night.

##### Gràcia
**Best for:** local vibes, independent travellers, budget stays
A bohemian neighbourhood with indie shops, local bars, and Plaça del Sol — one of Barcelona's best squares for an evening drink. Slightly further from the coast but well-connected by metro (L3 Fontana). Budget: EUR 60–130/night.

##### Poble Sec
**Best for:** nightlife, budget-conscious foodies
At the foot of Montjuïc, this neighbourhood has Barcelona's best pintxos street (Carrer de Blai) and is increasingly popular. Great value. Budget: EUR 55–120/night.

> **Book your accommodation.** Compare hotel options in Barcelona — from boutique stays in the Gothic Quarter to beachfront apartments in Barceloneta.

---

### Frequently Asked Questions

#### Is Barcelona safe for tourists?
Barcelona is generally safe for tourists. Petty theft — particularly pickpocketing on Las Ramblas and the metro — is the main concern. Keep valuables in a front pocket or cross-body bag, and be especially alert in crowded tourist areas and on public transport during rush hour.

#### What is the best time to visit Barcelona?
The best months are April–June and September–October, when temperatures sit at a comfortable 20–27°C and tourist crowds are smaller than in peak summer. July and August are hottest (29°C+) and most expensive.

#### How much does a taxi cost from Barcelona airport?
A taxi from Barcelona El Prat airport to the city centre costs a fixed EUR 39. The journey takes 20–30 minutes depending on traffic. Taxis are available outside both T1 and T2 arrivals.

#### Do people speak English in Barcelona?
Most people working in tourism, hotels, and restaurants speak English. Away from tourist areas, Spanish and Catalan are dominant. Learning a few phrases — "gràcies" (thank you in Catalan) or "por favor" (please in Spanish) — is always appreciated.

#### What currency does Barcelona use?
Barcelona uses the Euro (EUR). Credit and debit cards are widely accepted in restaurants, shops, and transport. However, smaller market stalls (like La Boqueria) and some neighbourhood bars may be cash-only. ATMs are plentiful; withdrawal fees are typically EUR 2–4.

#### Do I need travel insurance for Barcelona?
Travel insurance is not legally required but strongly recommended. The UK GHIC covers emergency public healthcare, but not repatriation, cancellations, theft, or private treatment. A basic single-trip policy typically costs GBP 15–30.

#### Is tipping expected in Barcelona?
Tipping is not expected in Spain but is appreciated. In restaurants, rounding up or leaving 5–10% for good service is common. For taxis, round up to the nearest euro. Hotel porters appreciate EUR 1–2 per bag.

#### Do I need a visa to visit Barcelona from the UK?
UK passport holders can visit Spain (and the wider Schengen area) for up to 90 days without a visa. From 2026, you'll need an approved ETIAS travel authorisation (EUR 7, valid for 3 years). Your passport must be valid for at least 3 months beyond your return date.

#### Is Barcelona expensive?
Barcelona is mid-range by Western European standards. Budget travellers can manage on EUR 60–80/day (hostel, public transport, supermarket lunches). A comfortable mid-range budget is EUR 120–180/day (3-star hotel, restaurants, activities). Fine dining and premium hotels push to EUR 300+/day.

#### How do I get from Barcelona to nearby beaches?
Barceloneta beach is walkable from the city centre (15 minutes from the Gothic Quarter). For quieter beaches, take the RENFE train south to Castelldefels (20 min, EUR 3.50) or north to Ocata (25 min, EUR 3.20). The Costa Brava is 1–1.5 hours by car or bus.

---

### Local Tips

- **Meal times:** Lunch is 1:30–3:30pm, dinner starts at 9pm. Restaurants open at 7pm for tourists, but the atmosphere is better from 9pm onward
- **Siesta:** Some small shops close 2–5pm, especially in residential neighbourhoods. Large stores and shopping centres stay open
- **Greetings:** Two kisses on the cheek (right then left) is standard when meeting friends. A handshake for business or first meetings
- **Catalan pride:** Barcelona is fiercely Catalan. Referring to it as "just Spanish" may raise eyebrows. Saying "gràcies" instead of "gracias" wins instant goodwill
- **Water:** Tap water is safe but tastes heavily of chlorine. Most locals drink bottled water (EUR 0.50–1.00 in shops, EUR 2–3 in restaurants)
- **Beach etiquette:** Topless sunbathing is common and unremarkable. Keep music volume reasonable. Don't buy from unlicensed beach vendors — products are usually counterfeit
- **Supermarkets:** Mercadona and Lidl are the best value. Open 9am–9pm most days. For late-night supplies, look for small "alimentació" shops
- **Metro tips:** Validate your T-Casual card on every trip — plain-clothes inspectors issue EUR 100+ fines for invalid tickets
