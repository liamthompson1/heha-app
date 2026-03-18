# Heha Bot Skills Guide

> This document teaches bots (and humans) how to create and manage content on Heha. Read this before making API calls.

---

## 1. Editorial Style

### Voice & Tone
- **Conversational but precise.** Write as a knowledgeable friend who has exact figures.
- **Answer-first.** Open every section with a direct answer in the first 1–2 sentences. No preamble.
- **Specific over vague.** "EUR 7.75" not "a few euros". "12 km" not "a short distance".
- **Helpful, not sales-y.** Product references should feel like genuine recommendations, not adverts.

### Structure Conventions
- Use real traveller questions as headings: "How do I get from Barcelona airport to the city centre?"
- Short paragraphs (2–4 sentences max).
- Use tables for comparative data (transport options, weather, prices).
- Use bullet lists for quick-reference info (emergency numbers, tips).
- Include "Last updated" context where relevant.

### SEO Guidance
- `page_title`: max 70 characters, include destination name and key intent.
- `description`: max 160 characters, summarise the page's value.
- Slug: lowercase, hyphens, descriptive. E.g. `barcelona`, `paris-airport-guide`.
- First paragraph should be a complete answer to the page's primary question.
- Include Schema.org JSON-LD (FAQPage, Article, BreadcrumbList) in destination pages.

### Linking Conventions
- Link to official sources (tourism boards, government sites) for authority.
- Cross-link between related destination pages where they exist.
- Product CTAs use generic language: "Compare airport parking options" (no booking URLs).

---

## 2. Language Rules

### Supported Languages
Currently: `en`, `fr`, `de`

### How Language Routing Works
- Every page belongs to exactly one language via the `lang` field.
- Public URLs: `/<lang>/<slug>` (e.g. `/en/barcelona`, `/fr/barcelone`).
- Language homepages: `/<lang>/index.html` list all published pages for that language.
- Root `/` redirects to the best language homepage based on the browser's `Accept-Language` header.
- No language mixing on a single URL. No IP-based localisation.

### Creating Multilingual Content
- Each language version of a page is a separate row in the database.
- The same slug can exist in different languages (e.g. `/en/barcelona` and `/fr/barcelone` are independent pages).
- There is no forced coupling between translations. If you want to link translations later, a `translation_group_id` can be added.
- Write content natively in each language — do not machine-translate and publish without review.

---

## 3. API Onboarding

### How API Keys Are Issued
1. An admin runs the provisioning CLI command.
2. The command generates a random API key and displays it **once**.
3. Only the hash is stored in the `api_clients` table.
4. Save the key securely — it cannot be retrieved after creation.

### How to Authenticate
Include your API key in every request:

```
Authorization: Bearer <YOUR_API_KEY>
```

The server hashes the key and compares it against stored hashes. Only active clients are accepted.

### Permissions
- `pages:read` — list, search, and read pages.
- `pages:write` — create, update, archive, and unarchive pages.

---

## 4. API Usage

Base URL: `/api/v1`

### List / Search Pages

```
GET /api/v1/pages
```

Query parameters:
| Param | Default | Description |
|-------|---------|-------------|
| `lang` | (all) | Filter by language code |
| `q` | — | Search across slug, title, description, content |
| `status` | `published` | `published`, `archived`, or `all` |
| `limit` | 50 | Max 200 |
| `cursor` | — | Pagination cursor from previous response |

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "lang": "en",
      "slug": "barcelona",
      "title": "Barcelona Travel Guide",
      "page_title": "Barcelona Travel Guide 2026",
      "description": "Complete Barcelona guide...",
      "template_key": "destination",
      "status": "published",
      "created_at": "2026-03-18T10:00:00Z",
      "updated_at": "2026-03-18T10:00:00Z",
      "created_by": { "type": "bot", "id": "content-bot-1" },
      "updated_by": { "type": "bot", "id": "content-bot-1" }
    }
  ],
  "next_cursor": "abc123"
}
```

### Get a Single Page

```
GET /api/v1/pages/<lang>/<slug>
```

Response includes `content_markdown` (not included in list responses).

### Create a Page

```
POST /api/v1/pages
```

```json
{
  "lang": "en",
  "slug": "barcelona",
  "title": "Barcelona Travel Guide",
  "page_title": "Barcelona Travel Guide 2026 — Everything You Need to Know",
  "description": "Complete Barcelona travel guide covering flights, weather, transport, and airport services.",
  "content_markdown": "# Barcelona\n\nBarcelona is Spain's vibrant Mediterranean port city...",
  "template_key": "destination",
  "status": "published"
}
```

Rules:
- `lang` is required.
- `title` is required.
- `content_markdown` is required.
- If `slug` is omitted, it is auto-generated from `title` and deduped within the language.
- If `(lang, slug)` already exists, returns `409 Conflict`.
- `template_key` defaults to `"editorial"` if omitted.
- `status` defaults to `"published"` if omitted.

### Update a Page

```
PUT /api/v1/pages/<lang>/<slug>
```

Partial updates allowed — only include fields you want to change:

```json
{
  "title": "Updated Title",
  "content_markdown": "# Updated Content\n\n..."
}
```

`updated_at` and `updated_by_*` are always set automatically.

### Archive a Page

```
POST /api/v1/pages/<lang>/<slug>/archive
```

Sets `status=archived`. The page returns 404 on the public site.

### Unarchive a Page

```
POST /api/v1/pages/<lang>/<slug>/unarchive
```

Sets `status=published`. The page becomes publicly visible again.

### Error Format

All errors return consistent JSON:

```json
{
  "error": {
    "code": "forbidden",
    "message": "Missing pages:write permission"
  }
}
```

Common error codes: `unauthorized`, `forbidden`, `not_found`, `conflict`, `validation_error`.

---

## 5. Guardrails

### No Deletion
Pages cannot be deleted via the API. Use archive/unarchive instead. Archiving is always reversible.

### Sanitisation
- `content_markdown` is rendered server-side with HTML sanitisation.
- Do not embed raw HTML or `<script>` tags in markdown — they will be stripped.

### Slug Rules
- Lowercase only: `[a-z0-9-]`
- No spaces, underscores, or special characters.
- Must be unique within a language.
- Examples: `barcelona`, `paris-airport-guide`, `best-time-to-visit-rome`

### Content Quality
- Every page should be substantial (aim for 1,000+ words for destination pages).
- FAQ sections need at least 8 Q&A pairs with answers of 50+ characters each.
- Include authority signals: cite sources, use precise figures, add "last updated" dates.
- One comprehensive guide per destination per language — depth over volume.

### Audit Trail
Every create and update records:
- `created_by_type` / `updated_by_type`: `"bot"` or `"human"`
- `created_by_id` / `updated_by_id`: your bot identifier
- `created_at` / `updated_at`: auto-set timestamps

---

## 6. Template Types

### `editorial` (default)
General-purpose markdown page. Clean editorial layout with title, content, and optional description.

### `destination`
Destination travel guide. Follows the structured template defined in `/docs/content-generation-skills.md`:
1. Hero & Quick Facts
2. Getting There
3. Airport Services
4. Best Time to Visit
5. Travel Essentials
6. Getting Around
7. Where to Stay (conditional)
8. FAQ Section (min 8 Q&A)
9. Local Tips (optional)

Destination pages integrate Holiday Extras products (parking, hotels, lounges, car hire, insurance, transfers, bundles) naturally within relevant sections.
