import { notFound } from "next/navigation";
import { getPage, listPages } from "@/lib/supabase/pages";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PageShell from "@/components/PageShell";
import type { Destination } from "@/types/destination";

export const revalidate = 300;

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pageToDestination(page: { key: string; content?: string; categories: string[]; meta: Record<string, unknown>; created_at?: string; updated_at: string }): Destination {
  const meta = (page.meta ?? {}) as Record<string, string>;
  return {
    id: page.key,
    slug: page.key,
    name: meta.name ?? titleCase(page.key),
    country: meta.country ?? "",
    continent: meta.continent ?? "",
    summary: meta.summary ?? "",
    hero_image_url: meta.hero_image_url ?? undefined,
    content_markdown: page.content ?? "",
    tags: page.categories ?? [],
    published: true,
    status: "published",
    created_at: page.created_at ?? page.updated_at,
    updated_at: page.updated_at,
    updated_by_name: "Claude",
  };
}

export async function generateStaticParams() {
  try {
    const pages = await listPages();
    return pages.map((p) => ({ slug: p.key }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Destination not found" };
  const destination = pageToDestination(page);

  return {
    title: `${destination.name}, ${destination.country} — Heha`,
    description: destination.summary,
    openGraph: {
      title: `${destination.name}, ${destination.country} — Heha`,
      description: destination.summary,
      images: destination.hero_image_url
        ? [{ url: destination.hero_image_url, width: 1200, height: 630 }]
        : [],
      url: `https://heha.ai/destinations/${destination.slug}`,
      type: "article",
    },
  };
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  const destination = pageToDestination(page);

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: destination.name,
    description: destination.summary,
    image: destination.hero_image_url,
    url: `https://heha.ai/destinations/${destination.slug}`,
    containedInPlace: {
      "@type": "Country",
      name: destination.country,
    },
    touristType: destination.tags,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <PageShell backHref="/destinations" maxWidth="5xl" variant="full">
        {/* Hero */}
        <div className="relative w-full overflow-hidden" style={{ height: "50vh", minHeight: 360 }}>
          {destination.hero_image_url && (
            <img
              src={destination.hero_image_url}
              alt={destination.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, var(--background) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-12">
            <div className="mx-auto max-w-[740px]">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                {destination.country} · {destination.continent}
              </p>
              <h1 className="gradient-text-subtle mt-2 text-5xl font-bold tracking-tight sm:text-6xl">
                {destination.name}
              </h1>
              <p
                className="mt-3 max-w-xl text-lg leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {destination.summary}
              </p>
              {destination.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {destination.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <article className="mx-auto max-w-[740px] px-6 pb-24 pt-12">
          <div className="glass-prose destination-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {destination.content_markdown}
            </ReactMarkdown>
          </div>

          {/* Attribution */}
          {destination.updated_by_name && (
            <div
              className="mt-12 border-t border-white/6 pt-6 text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              Last updated by{" "}
              <span style={{ color: "var(--text-secondary)" }}>
                {destination.updated_by_name}
              </span>{" "}
              on{" "}
              {new Date(destination.updated_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}
        </article>
      </PageShell>
    </>
  );
}
