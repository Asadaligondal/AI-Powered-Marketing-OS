"use server";

import { revalidatePath } from "next/cache";

import { brandEmbeddingSource } from "@/lib/brandEmbedding";
import { embed } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import type { BrandProduct } from "@/lib/types";

export type SaveBrandInput = {
  name: string;
  tagline: string;
  description: string;
  voice: string;
  audience: string;
  products: BrandProduct[];
  content_pillars: string[];
  pain_points: string[];
  competitors: string[];
};

export async function saveBrand(input: SaveBrandInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: brand, error: fetchErr } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!brand) return { ok: false, error: "Brand not found" };

  const summary = brandEmbeddingSource({
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    voice: input.voice,
    audience: input.audience,
  });
  let embedding: number[];
  try {
    embedding = await embed(summary);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Embedding failed";
    return { ok: false, error: msg };
  }

  const { error } = await supabase
    .from("brands")
    .update({
      name: input.name,
      tagline: input.tagline || null,
      description: input.description || null,
      voice: input.voice || null,
      audience: input.audience || null,
      products: input.products,
      content_pillars: input.content_pillars,
      pain_points: input.pain_points,
      competitors: input.competitors,
      embedding,
      updated_at: new Date().toISOString(),
    })
    .eq("id", brand.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/brand");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type AcceptField =
  | "name"
  | "tagline"
  | "description"
  | "voice"
  | "audience"
  | "products"
  | "content_pillars"
  | "pain_points"
  | "competitors";

export async function acceptBrandSuggestion(input: {
  field: AcceptField;
  value: string | BrandProduct[] | string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: brand, error: fetchErr } = await supabase
    .from("brands")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!brand) return { ok: false, error: "Brand not found" };

  const patch: Record<string, unknown> = {
    [input.field]: input.value,
    updated_at: new Date().toISOString(),
  };

  const textForEmbed = {
    name: input.field === "name" ? (input.value as string) : brand.name,
    tagline: input.field === "tagline" ? (input.value as string) : brand.tagline,
    description:
      input.field === "description" ? (input.value as string) : brand.description,
    voice: input.field === "voice" ? (input.value as string) : brand.voice,
    audience: input.field === "audience" ? (input.value as string) : brand.audience,
  };

  let embedding: number[];
  try {
    embedding = await embed(brandEmbeddingSource(textForEmbed));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Embedding failed";
    return { ok: false, error: msg };
  }

  const { error } = await supabase
    .from("brands")
    .update({
      ...patch,
      embedding,
    })
    .eq("id", brand.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/brand");
  revalidatePath("/dashboard");
  return { ok: true };
}
