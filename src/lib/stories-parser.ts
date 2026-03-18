export interface Section {
  title: string;
  html: string;
}

export function parseStoriesHtml(html: string): Section[] {
  const parts = html.split(/<h2[^>]*>/i);
  return parts
    .slice(1) // skip content before first <h2>
    .map((part) => {
      const closeIdx = part.indexOf("</h2>");
      if (closeIdx === -1) return null;
      const title = part.slice(0, closeIdx).replace(/<[^>]+>/g, "").trim();
      const body = part.slice(closeIdx + 5).trim();
      if (!body) return null;
      return { title, html: body };
    })
    .filter(Boolean) as Section[];
}

export const INSURANCE_KEYWORDS = /insurance|travel\s*cover|protection\s*plan/i;
