import { getSupabaseClient } from "./client";

export interface Page {
  key: string;
  content: string;
  categories: string[];
  created_at: string;
  updated_at: string;
}

export async function getPage(key: string): Promise<Page | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("key", key)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    console.error("Failed to get page:", error.message);
    return null;
  }

  return data;
}

export async function upsertPage(
  key: string,
  content: string,
  categories: string[] = []
): Promise<Page | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pages")
    .upsert({ key, content, categories, updated_at: new Date().toISOString() })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to upsert page:", error.message);
    return null;
  }

  return data;
}

export async function categoryExistsOnPage(
  pageKey: string,
  category: string
): Promise<boolean> {
  const page = await getPage(pageKey);
  if (!page) return false;
  return page.categories.includes(category.toLowerCase());
}

export async function appendCategory(
  pageKey: string,
  category: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("append_category", {
    page_key: pageKey,
    category: category.toLowerCase(),
  });

  if (error) {
    console.error("Failed to append category:", error.message);
    return false;
  }

  return true;
}

export async function listPages(): Promise<Pick<Page, "key" | "categories">[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pages")
    .select("key, categories")
    .order("key");

  if (error) {
    console.error("Failed to list pages:", error.message);
    return [];
  }

  return data ?? [];
}
