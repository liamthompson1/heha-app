import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getPage, upsertPage } from "@/lib/supabase/pages";

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a travel content writer for Heha (heha.ai), a UK travel platform.

Call submit_page_content once with all sections filled in.

Rules:
- Answer-first: each section opens with a direct 1-2 sentence answer, no preamble
- Use real traveller questions as section headings where prose is included
- Precise figures: "EUR 7.75" not "a few euros", "12 km" not "a short distance"
- British English
- FAQ: minimum 8 Q&A pairs covering weather, transport, safety, currency, language, tipping, visa
- monthlyWeather: exactly 12 entries with realistic data for the destination
- Use database data where provided; fall back to accurate general knowledge`;

// ─── Tool definition ──────────────────────────────────────────────────────────

const PAGE_CONTENT_TOOL: Anthropic.Tool = {
  name: "submit_page_content",
  description:
    "Submit structured destination page content with all required sections.",
  input_schema: {
    type: "object" as const,
    required: [
      "hero",
      "gettingThere",
      "airportServices",
      "bestTime",
      "travelEssentials",
      "gettingAround",
      "faq",
    ],
    properties: {
      hero: {
        type: "object",
        required: ["headline", "quickFacts"],
        properties: {
          headline: {
            type: "string",
            description: "One-sentence summary of the destination",
          },
          quickFacts: {
            type: "object",
            required: [
              "currency",
              "language",
              "timezone",
              "drivingSide",
              "callingCode",
              "bestSeason",
              "advisoryLevel",
            ],
            properties: {
              currency: { type: "string" },
              language: { type: "string" },
              timezone: { type: "string" },
              drivingSide: { type: "string", enum: ["left", "right"] },
              callingCode: { type: "string" },
              bestSeason: { type: "string" },
              advisoryLevel: { type: "string" },
            },
          },
        },
      },
      gettingThere: {
        type: "object",
        required: [
          "airportName",
          "airportCode",
          "distanceFromCity",
          "intro",
          "transportOptions",
        ],
        properties: {
          airportName: { type: "string" },
          airportCode: { type: "string" },
          distanceFromCity: { type: "string" },
          intro: {
            type: "string",
            description: "Answer-first 1-2 sentence opening",
          },
          transportOptions: {
            type: "array",
            minItems: 2,
            items: {
              type: "object",
              required: ["mode", "duration", "cost", "frequency"],
              properties: {
                mode: { type: "string" },
                duration: { type: "string" },
                cost: { type: "string" },
                frequency: { type: "string" },
                notes: { type: "string" },
              },
            },
          },
          tips: { type: "array", items: { type: "string" } },
        },
      },
      airportServices: {
        type: "object",
        required: ["terminalCount", "terminalDescription"],
        properties: {
          terminalCount: { type: "number" },
          terminalDescription: { type: "string" },
          wifiInfo: { type: "string" },
          securityInfo: { type: "string" },
          facilities: { type: "array", items: { type: "string" } },
        },
      },
      bestTime: {
        type: "object",
        required: ["summary", "monthlyWeather"],
        properties: {
          summary: { type: "string" },
          monthlyWeather: {
            type: "array",
            minItems: 12,
            maxItems: 12,
            items: {
              type: "object",
              required: ["month", "highC", "lowC", "rainPercent", "conditions"],
              properties: {
                month: { type: "string" },
                highC: { type: "number" },
                lowC: { type: "number" },
                rainPercent: { type: "number" },
                conditions: { type: "string" },
              },
            },
          },
          peakSeason: {
            type: "object",
            properties: {
              months: { type: "string" },
              description: { type: "string" },
            },
          },
          offPeakSeason: {
            type: "object",
            properties: {
              months: { type: "string" },
              description: { type: "string" },
            },
          },
          events: {
            type: "array",
            items: {
              type: "object",
              required: ["month", "name", "description"],
              properties: {
                month: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
              },
            },
          },
        },
      },
      travelEssentials: {
        type: "object",
        required: ["visaInfo", "healthInfo", "safetyInfo", "emergencyNumbers"],
        properties: {
          visaInfo: { type: "string" },
          healthInfo: { type: "string" },
          safetyInfo: { type: "string" },
          emergencyNumbers: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["service", "number"],
              properties: {
                service: { type: "string" },
                number: { type: "string" },
              },
            },
          },
          embassyAddress: { type: "string" },
          embassyPhone: { type: "string" },
        },
      },
      gettingAround: {
        type: "object",
        required: ["summary"],
        properties: {
          summary: { type: "string" },
          publicTransport: { type: "string" },
          taxiInfo: { type: "string" },
          walkingCycling: { type: "string" },
        },
      },
      whereToStay: {
        type: "object",
        properties: {
          neighbourhoods: {
            type: "array",
            minItems: 3,
            items: {
              type: "object",
              required: ["name", "bestFor", "description"],
              properties: {
                name: { type: "string" },
                bestFor: { type: "string" },
                description: { type: "string" },
                priceRange: { type: "string" },
              },
            },
          },
        },
      },
      faq: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            minItems: 8,
            items: {
              type: "object",
              required: ["question", "answer"],
              properties: {
                question: { type: "string" },
                answer: { type: "string", minLength: 50 },
              },
            },
          },
        },
      },
      localTips: {
        type: "array",
        items: {
          type: "object",
          required: ["topic", "detail"],
          properties: {
            topic: { type: "string" },
            detail: { type: "string" },
          },
        },
      },
    },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageContent {
  hero: {
    headline: string;
    quickFacts: {
      currency: string;
      language: string;
      timezone: string;
      drivingSide: string;
      callingCode: string;
      bestSeason: string;
      advisoryLevel: string;
    };
  };
  gettingThere: {
    airportName: string;
    airportCode: string;
    distanceFromCity: string;
    intro: string;
    transportOptions: Array<{
      mode: string;
      duration: string;
      cost: string;
      frequency: string;
      notes?: string;
    }>;
    tips?: string[];
  };
  airportServices: {
    terminalCount: number;
    terminalDescription: string;
    wifiInfo?: string;
    securityInfo?: string;
    facilities?: string[];
  };
  bestTime: {
    summary: string;
    monthlyWeather: Array<{
      month: string;
      highC: number;
      lowC: number;
      rainPercent: number;
      conditions: string;
    }>;
    peakSeason?: { months: string; description: string };
    offPeakSeason?: { months: string; description: string };
    events?: Array<{ month: string; name: string; description: string }>;
  };
  travelEssentials: {
    visaInfo: string;
    healthInfo: string;
    safetyInfo: string;
    emergencyNumbers: Array<{ service: string; number: string }>;
    embassyAddress?: string;
    embassyPhone?: string;
  };
  gettingAround: {
    summary: string;
    publicTransport?: string;
    taxiInfo?: string;
    walkingCycling?: string;
  };
  whereToStay?: {
    neighbourhoods: Array<{
      name: string;
      bestFor: string;
      description: string;
      priceRange?: string;
    }>;
  };
  faq: {
    items: Array<{ question: string; answer: string }>;
  };
  localTips?: Array<{ topic: string; detail: string }>;
}

// ─── CTAs ─────────────────────────────────────────────────────────────────────

const CTA_TRANSFERS = `> **Book airport transfers** — pre-book your taxi or shuttle with [Heha Transfers](https://heha.ai/airport-transfers) and skip the taxi rank.`;
const CTA_CAR_HIRE = `> **Hire a car from the airport** — compare rates from top suppliers with [Heha Car Hire](https://heha.ai/car-hire).`;
const CTA_PARKING = `> **Airport parking** — pre-book at the lowest price with [Heha Airport Parking](https://heha.ai/airport-parking).`;
const CTA_LOUNGE = `> **Airport lounge access** — relax before your flight with [Heha Lounge](https://heha.ai/airport-lounges).`;
const CTA_HOTEL_AIRPORT = `> **Airport hotels** — stay the night before your flight with [Heha Airport Hotels](https://heha.ai/airport-hotels).`;
const CTA_BUNDLE = `> **Bundle and save** — combine parking, lounge, and hotel with [Heha Bundle](https://heha.ai/holiday-extras).`;
const CTA_INSURANCE = `> **Travel insurance** — protect your trip with [Heha Travel Insurance](https://heha.ai/travel-insurance).`;

// ─── Validation ───────────────────────────────────────────────────────────────

function validatePageContent(data: unknown): asserts data is PageContent {
  if (!data || typeof data !== "object") {
    throw new Error("Tool input is not an object");
  }
  const d = data as Record<string, unknown>;
  const required = [
    "hero",
    "gettingThere",
    "airportServices",
    "bestTime",
    "travelEssentials",
    "gettingAround",
    "faq",
  ];
  for (const key of required) {
    if (!d[key]) throw new Error(`Missing required section: ${key}`);
  }
  const faq = d.faq as { items?: Array<{ answer: string }> };
  if (!faq.items || faq.items.length < 8) {
    throw new Error(
      `FAQ must have at least 8 items, got ${faq.items?.length ?? 0}`
    );
  }
  for (const item of faq.items) {
    if (item.answer.length < 50) {
      throw new Error(
        `FAQ answer too short (< 50 chars): "${item.answer.slice(0, 30)}..."`
      );
    }
  }
}

// ─── Schema.org ───────────────────────────────────────────────────────────────

function generateSchemaOrg(
  slug: string,
  cityName: string,
  data: PageContent
): string {
  const now = new Date().toISOString();
  const url = `https://heha.ai/${slug}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.hero.headline,
    url,
    dateModified: now,
    datePublished: now,
    author: { "@type": "Organization", name: "Heha" },
    publisher: {
      "@type": "Organization",
      name: "Heha",
      url: "https://heha.ai",
    },
    about: { "@type": "Place", name: cityName },
  };

  return [
    `\n<script type="application/ld+json">`,
    JSON.stringify(faqSchema, null, 2),
    `</script>`,
    `\n<script type="application/ld+json">`,
    JSON.stringify(articleSchema, null, 2),
    `</script>`,
  ].join("\n");
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

function renderToMarkdown(slug: string, data: PageContent): string {
  const cityName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const lines: string[] = [];

  // 1. Hero
  lines.push(`# ${cityName}`);
  lines.push(``);
  lines.push(data.hero.headline);
  lines.push(``);
  const qf = data.hero.quickFacts;
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| **Currency** | ${qf.currency} |`);
  lines.push(`| **Language** | ${qf.language} |`);
  lines.push(`| **Timezone** | ${qf.timezone} |`);
  lines.push(`| **Driving side** | ${qf.drivingSide} |`);
  lines.push(`| **Calling code** | ${qf.callingCode} |`);
  lines.push(`| **Best season** | ${qf.bestSeason} |`);
  lines.push(`| **Travel advisory** | ${qf.advisoryLevel} |`);

  // 2. Getting There
  lines.push(``);
  lines.push(`## Getting There`);
  lines.push(``);
  const gt = data.gettingThere;
  lines.push(gt.intro);
  lines.push(``);
  lines.push(
    `**${gt.airportName} (${gt.airportCode})** — ${gt.distanceFromCity} from the city centre.`
  );
  lines.push(``);
  lines.push(`| Mode | Duration | Cost | Frequency |`);
  lines.push(`|------|----------|------|-----------|`);
  for (const opt of gt.transportOptions) {
    lines.push(
      `| ${opt.mode} | ${opt.duration} | ${opt.cost} | ${opt.frequency} |`
    );
  }
  lines.push(``);
  // CTA: Transfers + Car hire after transport table
  lines.push(CTA_TRANSFERS);
  lines.push(``);
  lines.push(CTA_CAR_HIRE);
  if (gt.tips && gt.tips.length > 0) {
    lines.push(``);
    lines.push(`**Tips:**`);
    for (const tip of gt.tips) {
      lines.push(`- ${tip}`);
    }
  }

  // 3. Airport Services
  lines.push(``);
  lines.push(`## ${gt.airportName}: What to Expect`);
  lines.push(``);
  const as_ = data.airportServices;
  lines.push(as_.terminalDescription);
  if (as_.wifiInfo) {
    lines.push(``);
    lines.push(`**Wi-Fi:** ${as_.wifiInfo}`);
  }
  if (as_.securityInfo) {
    lines.push(``);
    lines.push(`**Security:** ${as_.securityInfo}`);
  }
  if (as_.facilities && as_.facilities.length > 0) {
    lines.push(``);
    lines.push(`**Facilities:** ${as_.facilities.join(", ")}`);
  }
  lines.push(``);
  // CTA: Parking + Lounge + Hotel + Bundle after airport description
  lines.push(CTA_PARKING);
  lines.push(``);
  lines.push(CTA_LOUNGE);
  lines.push(``);
  lines.push(CTA_HOTEL_AIRPORT);
  lines.push(``);
  lines.push(CTA_BUNDLE);

  // 4. Best Time to Visit
  lines.push(``);
  lines.push(`## Best Time to Visit ${cityName}`);
  lines.push(``);
  const bt = data.bestTime;
  lines.push(bt.summary);
  lines.push(``);
  lines.push(`| Month | High (°C) | Low (°C) | Rain | Conditions |`);
  lines.push(`|-------|-----------|----------|------|------------|`);
  for (const w of bt.monthlyWeather) {
    lines.push(
      `| ${w.month} | ${w.highC} | ${w.lowC} | ${w.rainPercent}% | ${w.conditions} |`
    );
  }
  if (bt.peakSeason) {
    lines.push(``);
    lines.push(
      `**Peak season (${bt.peakSeason.months}):** ${bt.peakSeason.description}`
    );
  }
  if (bt.offPeakSeason) {
    lines.push(``);
    lines.push(
      `**Off-peak (${bt.offPeakSeason.months}):** ${bt.offPeakSeason.description}`
    );
  }
  if (bt.events && bt.events.length > 0) {
    lines.push(``);
    lines.push(`### Events and Festivals`);
    lines.push(``);
    for (const ev of bt.events) {
      lines.push(`- **${ev.name}** (${ev.month}): ${ev.description}`);
    }
  }

  // 5. Travel Essentials
  lines.push(``);
  lines.push(`## Travel Essentials`);
  lines.push(``);
  const te = data.travelEssentials;
  lines.push(`**Visas:** ${te.visaInfo}`);
  lines.push(``);
  lines.push(`**Health:** ${te.healthInfo}`);
  lines.push(``);
  lines.push(`**Safety:** ${te.safetyInfo}`);
  lines.push(``);
  if (te.emergencyNumbers.length > 0) {
    lines.push(`**Emergency numbers:**`);
    for (const en of te.emergencyNumbers) {
      lines.push(`- ${en.service}: ${en.number}`);
    }
  }
  if (te.embassyAddress || te.embassyPhone) {
    lines.push(``);
    lines.push(`**British Embassy:**`);
    if (te.embassyAddress) lines.push(`- Address: ${te.embassyAddress}`);
    if (te.embassyPhone) lines.push(`- Phone: ${te.embassyPhone}`);
  }
  lines.push(``);
  // CTA: Insurance after travel essentials
  lines.push(CTA_INSURANCE);

  // 6. Getting Around
  lines.push(``);
  lines.push(`## Getting Around ${cityName}`);
  lines.push(``);
  const ga = data.gettingAround;
  lines.push(ga.summary);
  if (ga.publicTransport) {
    lines.push(``);
    lines.push(`**Public transport:** ${ga.publicTransport}`);
  }
  if (ga.taxiInfo) {
    lines.push(``);
    lines.push(`**Taxis:** ${ga.taxiInfo}`);
  }
  if (ga.walkingCycling) {
    lines.push(``);
    lines.push(`**Walking & cycling:** ${ga.walkingCycling}`);
  }
  lines.push(``);
  // CTA: Car hire (local) after getting around
  lines.push(CTA_CAR_HIRE);

  // 7. Where to Stay (optional)
  if (
    data.whereToStay?.neighbourhoods &&
    data.whereToStay.neighbourhoods.length >= 3
  ) {
    lines.push(``);
    lines.push(`## Where to Stay in ${cityName}`);
    lines.push(``);
    for (const n of data.whereToStay.neighbourhoods) {
      lines.push(`### ${n.name}`);
      lines.push(``);
      lines.push(`**Best for:** ${n.bestFor}`);
      lines.push(``);
      lines.push(n.description);
      if (n.priceRange) {
        lines.push(``);
        lines.push(`**Price range:** ${n.priceRange}`);
      }
      lines.push(``);
    }
    // CTA: Hotels after neighbourhoods
    lines.push(CTA_HOTEL_AIRPORT);
  }

  // 8. FAQ
  lines.push(``);
  lines.push(`## Frequently Asked Questions`);
  lines.push(``);
  for (const item of data.faq.items) {
    lines.push(`### ${item.question}`);
    lines.push(``);
    lines.push(item.answer);
    lines.push(``);
  }

  // 9. Local Tips (optional)
  if (data.localTips && data.localTips.length > 0) {
    lines.push(`## Local Tips`);
    lines.push(``);
    for (const tip of data.localTips) {
      lines.push(`**${tip.topic}:** ${tip.detail}`);
      lines.push(``);
    }
  }

  // Schema.org JSON-LD
  lines.push(generateSchemaOrg(slug, cityName, data));

  return lines.join("\n");
}

// ─── Generation ───────────────────────────────────────────────────────────────

export async function generatePage(slug: string): Promise<string> {
  const supabase = getSupabaseClient();
  const cityName = slug.replace(/-/g, " ");

  const [{ data: destination }, { data: airports }] = await Promise.all([
    supabase
      .from("destinations")
      .select("*")
      .ilike("city", cityName)
      .limit(1)
      .single(),
    supabase.from("airports").select("*").ilike("city", cityName).limit(3),
  ]);

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    tools: [PAGE_CONTENT_TOOL],
    tool_choice: { type: "tool", name: "submit_page_content" },
    messages: [
      {
        role: "user",
        content: `Generate a complete destination guide for: ${slug}

Destination data from our database:
${destination ? JSON.stringify(destination, null, 2) : "No record — use well-known general knowledge"}

Airport data:
${airports && airports.length > 0 ? JSON.stringify(airports, null, 2) : "No record — use well-known general knowledge"}

Call submit_page_content now with all sections filled in.`,
      },
    ],
  });

  const toolBlock = response.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === "submit_page_content"
  );

  if (!toolBlock) {
    throw new Error("Claude did not call submit_page_content tool");
  }

  validatePageContent(toolBlock.input);

  const markdown = renderToMarkdown(slug, toolBlock.input);
  await upsertPage(slug, markdown, ["destination"]);

  return markdown;
}

// ─── Prompt-driven generator ──────────────────────────────────────────────────

export async function generatePageFromPrompt(
  prompt: string,
  slug: string
): Promise<string> {
  const skillsPath = path.join(process.cwd(), "public", "skills.md");
  const skillsContent = fs.readFileSync(skillsPath, "utf-8");

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: `You are a travel content writer for Heha (heha.ai), a UK travel platform.

Use the following guide to understand editorial standards, page templates, and content structure:

${skillsContent}

Generate complete, production-ready markdown content for the requested page.
- Write in British English
- Choose the appropriate template structure based on the page type described in the prompt
- Return ONLY the markdown content — no preamble, no explanation, no code fences`,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nPage slug: ${slug}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return text content");
  }

  const markdown = textBlock.text;
  await upsertPage(slug, markdown, []);
  return markdown;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function getOrGeneratePage(
  slug: string
): Promise<{ content: string; generated: boolean }> {
  const existing = await getPage(slug);
  if (existing?.content) {
    return { content: existing.content, generated: false };
  }

  const content = await generatePage(slug);
  return { content, generated: true };
}
