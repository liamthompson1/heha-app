import { notFound } from "next/navigation";
import { marked } from "marked";
import { getOrGeneratePage } from "@/lib/content/page-generator";
import { slugSchema } from "@/lib/content";

export const maxDuration = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title: `${title} Travel Guide — Heha`,
    description: `Everything you need to know before visiting ${title}: transport, weather, visas, airport services, and more.`,
  };
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params;

  if (!slugSchema.safeParse(slug).success) notFound();

  const { content } = await getOrGeneratePage(slug);
  const html = await marked.parse(content);

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <article
          className="prose-destination"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  );
}
