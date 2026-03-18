export interface Destination {
  id: string;
  slug: string;
  name: string;
  country: string;
  continent: string;
  hero_image_url?: string;
  summary: string;
  content_markdown: string;
  tags: string[];
  published: boolean;
  status: "published" | "draft" | "pending_review";
  created_at: string;
  updated_at: string;
  updated_by_name?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  auto_publish: boolean;
  created_at: string;
  last_used_at?: string;
  revoked: boolean;
}

export interface ContentHistoryEntry {
  id: string;
  destination_slug: string;
  action: "create" | "update" | "delete";
  actor_type: "human" | "bot";
  actor_name: string;
  created_at: string;
}

export interface AdminStats {
  total_destinations: number;
  published_destinations: number;
  active_bots: number;
  pending_reviews: number;
  recent_updates: number;
}
