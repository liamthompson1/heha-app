import { notFound } from "next/navigation";
import { fetchDestination, fetchDestinations } from "@/lib/api/destinations";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import HxNavbar from "@/components/admin/HxNavbar";

export const revalidate = 300;

export async function generateStaticParams() {
  const destinations = await fetchDestinations();
  return destinations
    .filter((d) => d.published)
    .map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await fetchDestination(slug);
  if (!destination) return { title: "Destination not found" };

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
  const destination = await fetchDestination(slug);
  if (!destination) notFound();

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

      <div className="hx-page">
        <HxNavbar />

        {/* Hero */}
        <div
          style={{
            position: "relative",
            height: "50vh",
            minHeight: 360,
            width: "100%",
            overflow: "hidden",
          }}
        >
          {destination.hero_image_url && (
            <img
              src={destination.hero_image_url}
              alt={destination.name}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, #050510 0%, rgba(5,5,16,0.6) 50%, transparent 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "0 24px 48px",
            }}
          >
            <div style={{ maxWidth: 740, margin: "0 auto" }}>
              <p
                className="hx-eyebrow"
                style={{ marginBottom: 8 }}
              >
                {destination.country} · {destination.continent}
              </p>
              <h1
                className="hx-heading"
                style={{ fontSize: "clamp(40px, 8vw, 64px)" }}
              >
                {destination.name}
              </h1>
              <p
                className="hx-text-secondary"
                style={{
                  fontSize: "clamp(16px, 2.5vw, 19px)",
                  lineHeight: 1.5,
                  marginTop: 12,
                  maxWidth: 560,
                }}
              >
                {destination.summary}
              </p>
              {destination.tags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 16,
                  }}
                >
                  {destination.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 980,
                        border: "0.5px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.56)",
                      }}
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
        <article
          style={{
            maxWidth: 740,
            margin: "0 auto",
            padding: "48px 24px 100px",
          }}
        >
          <div className="glass-prose destination-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {destination.content_markdown}
            </ReactMarkdown>
          </div>

          {/* Attribution */}
          {destination.updated_by_name && (
            <div
              style={{
                marginTop: 48,
                paddingTop: 24,
                borderTop: "0.5px solid rgba(255,255,255,0.06)",
                fontSize: 13,
              }}
              className="hx-text-tertiary"
            >
              Last updated by{" "}
              <span className="hx-text-secondary">
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
      </div>
    </>
  );
}
