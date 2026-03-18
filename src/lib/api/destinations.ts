import type {
  Destination,
  ApiKey,
  ContentHistoryEntry,
  AdminStats,
} from "@/types/destination";

// ---------------------------------------------------------------------------
// Internal page shapes returned by /api/pages
// ---------------------------------------------------------------------------

interface PageListItem {
  key: string;
  categories: string[];
  meta: Record<string, unknown>;
  updated_at: string;
}

interface PageFull extends PageListItem {
  content: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pageToDestination(page: PageListItem | PageFull): Destination {
  const meta = (page.meta ?? {}) as Record<string, string>;
  const full = page as PageFull;
  return {
    id: page.key,
    slug: page.key,
    name: meta.name ?? titleCase(page.key),
    country: meta.country ?? "",
    continent: meta.continent ?? "",
    summary: meta.summary ?? "",
    hero_image_url: meta.hero_image_url ?? undefined,
    content_markdown: full.content ?? "",
    tags: page.categories ?? [],
    published: true,
    status: "published",
    created_at: full.created_at ?? page.updated_at,
    updated_at: page.updated_at,
    updated_by_name: "Claude",
  };
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
  const res = await fetch("/api/pages");
  if (!res.ok) return [];
  const { pages } = (await res.json()) as { pages: PageListItem[] };
  let results = pages.map(pageToDestination);
  if (filters?.continent)
    results = results.filter((d) => d.continent === filters.continent);
  if (filters?.tag)
    results = results.filter((d) => d.tags.includes(filters.tag!));
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (d) =>
        d.name.toLowerCase().includes(q) || d.slug.toLowerCase().includes(q)
    );
  }
  // All pages are treated as published — status filter is a no-op
  return results;
}

export async function fetchDestination(
  slug: string
): Promise<Destination | null> {
  const res = await fetch(`/api/pages/${slug}`);
  if (!res.ok) return null;
  const page = (await res.json()) as PageFull;
  return pageToDestination(page);
}

// ---------------------------------------------------------------------------
// Admin — Destinations
// ---------------------------------------------------------------------------

export async function createDestination(
  data: Partial<Destination>
): Promise<Destination> {
  const res = await fetch("/api/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: data.slug, prompt: data.summary ?? data.name }),
  });
  if (!res.ok) throw new Error(`Failed to create: ${res.status}`);
  const { slug: createdSlug, content } = (await res.json()) as {
    slug: string;
    content: string;
  };
  const now = new Date().toISOString();
  return {
    id: createdSlug,
    slug: createdSlug,
    name: data.name ?? titleCase(createdSlug),
    country: data.country ?? "",
    continent: data.continent ?? "",
    summary: data.summary ?? "",
    hero_image_url: data.hero_image_url,
    content_markdown: content,
    tags: data.tags ?? [],
    published: true,
    status: "published",
    created_at: now,
    updated_at: now,
    updated_by_name: "Claude",
  };
}

export async function updateDestination(
  slug: string,
  data: Partial<Destination>
): Promise<Destination> {
  const res = await fetch(`/api/pages/${slug}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: data.content_markdown, categories: data.tags }),
  });
  if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
  const page = (await res.json()) as PageFull;
  return pageToDestination(page);
}

export async function publishDestination(_slug: string): Promise<void> {
  // No status concept yet — no-op
}

export async function reviewContent(
  _id: string,
  _action: "approve" | "reject"
): Promise<void> {
  // No review queue yet — no-op
}

// ---------------------------------------------------------------------------
// API Keys — stubs (out of scope)
// ---------------------------------------------------------------------------

export async function fetchApiKeys(): Promise<ApiKey[]> {
  return [];
}

export async function createApiKey(
  _name: string,
  _config: { auto_publish: boolean }
): Promise<{ key: string } & ApiKey> {
  throw new Error("API key management not implemented");
}

export async function revokeApiKey(_id: string): Promise<void> {}

// ---------------------------------------------------------------------------
// Content History
// ---------------------------------------------------------------------------

export async function fetchContentHistory(
  slug?: string
): Promise<ContentHistoryEntry[]> {
  if (slug) {
    const res = await fetch(`/api/pages/${slug}`);
    if (!res.ok) return [];
    const page = (await res.json()) as PageFull;
    return [
      {
        id: `${page.key}-updated`,
        destination_slug: page.key,
        action: "update",
        actor_type: "bot",
        actor_name: "Claude",
        created_at: page.updated_at,
      },
    ];
  }
  const res = await fetch("/api/pages");
  if (!res.ok) return [];
  const { pages } = (await res.json()) as { pages: PageListItem[] };
  return pages.map((page) => ({
    id: `${page.key}-updated`,
    destination_slug: page.key,
    action: "update" as const,
    actor_type: "bot" as const,
    actor_name: "Claude",
    created_at: page.updated_at,
  }));
}

// ---------------------------------------------------------------------------
// Admin Stats
// ---------------------------------------------------------------------------

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch("/api/pages");
  if (!res.ok) {
    return {
      total_destinations: 0,
      published_destinations: 0,
      active_bots: 1,
      pending_reviews: 0,
      recent_updates: 0,
    };
  }
  const { pages } = (await res.json()) as { pages: PageListItem[] };
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  return {
    total_destinations: pages.length,
    published_destinations: pages.filter((p) =>
      p.categories.includes("destination")
    ).length,
    active_bots: 1,
    pending_reviews: 0,
    recent_updates: pages.filter((p) => p.updated_at > sevenDaysAgo).length,
  };
}
