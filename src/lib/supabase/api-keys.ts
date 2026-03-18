import { getSupabaseClient } from "./client";

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  auto_publish: boolean;
  last_used_at: string | null;
  created_at: string;
}

async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateRawKey(): string {
  const hex = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  return `sk_heha_${hex}`;
}

export async function createApiKey(
  name: string,
  autoPublish: boolean
): Promise<{ row: ApiKeyRow; rawKey: string }> {
  const supabase = getSupabaseClient();
  const rawKey = generateRawKey();
  const keyHash = await sha256(rawKey);
  const prefix = rawKey.slice(0, 16);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ name, key_hash: keyHash, prefix, auto_publish: autoPublish })
    .select("id, name, prefix, auto_publish, last_used_at, created_at")
    .single();

  if (error) throw new Error(`Failed to create API key: ${error.message}`);
  return { row: data, rawKey };
}

export async function listApiKeys(): Promise<ApiKeyRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, prefix, auto_publish, last_used_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list API keys:", error.message);
    return [];
  }
  return data ?? [];
}

export async function validateApiKey(
  rawKey: string
): Promise<{ valid: boolean; autoPublish: boolean; keyId: string } | null> {
  const supabase = getSupabaseClient();
  const keyHash = await sha256(rawKey);

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, auto_publish")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data) return null;

  // Update last_used_at in the background
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return { valid: true, autoPublish: data.auto_publish, keyId: data.id };
}

export async function revokeApiKey(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("api_keys").delete().eq("id", id);
  if (error) {
    console.error("Failed to revoke API key:", error.message);
    return false;
  }
  return true;
}
