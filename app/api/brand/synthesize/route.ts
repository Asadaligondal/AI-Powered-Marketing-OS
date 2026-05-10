import { NextResponse } from "next/server";

import { chunkTextByParagraphs } from "@/lib/chunkText";
import { chatJsonCompletion, embed, MODELS } from "@/lib/openai";
import {
  BRAND_SYNTHESIS_SYSTEM_PREFIX,
  buildBrandSynthesisUserMessage,
} from "@/lib/prompts/brandSynthesis";
import { createClient } from "@/lib/supabase/server";
import type { BrandSynthesisSuggestion } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof (body as { title?: unknown }).title === "string" ? (body as { title: string }).title : "";
  const content =
    typeof (body as { content?: unknown }).content === "string"
      ? (body as { content: string }).content
      : "";

  if (!content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (brandErr) {
    return NextResponse.json({ error: brandErr.message }, { status: 500 });
  }
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const { data: docRow, error: docErr } = await supabase
    .from("brand_documents")
    .insert({
      brand_id: brand.id,
      title: title.trim() || null,
      source_type: "pasted",
      raw_content: content,
    })
    .select("id")
    .single();

  if (docErr || !docRow) {
    return NextResponse.json({ error: docErr?.message ?? "Failed to store document" }, { status: 500 });
  }

  const chunks = chunkTextByParagraphs(content);
  for (let i = 0; i < chunks.length; i++) {
    const piece = chunks[i];
    const embedding = await embed(piece);
    const { error: chErr } = await supabase.from("brand_document_chunks").insert({
      document_id: docRow.id,
      brand_id: brand.id,
      chunk_index: i,
      content: piece,
      embedding,
    });
    if (chErr) {
      return NextResponse.json({ error: chErr.message }, { status: 500 });
    }
  }

  const existingBrandJson = JSON.stringify({
    name: brand.name,
    tagline: brand.tagline,
    description: brand.description,
    voice: brand.voice,
    audience: brand.audience,
    products: brand.products,
    content_pillars: brand.content_pillars,
    pain_points: brand.pain_points,
    competitors: brand.competitors,
  });

  const system = `${BRAND_SYNTHESIS_SYSTEM_PREFIX}
${existingBrandJson}`;

  const userMsg = buildBrandSynthesisUserMessage(title, content);

  let suggestions: BrandSynthesisSuggestion;
  try {
    const { raw } = await chatJsonCompletion({
      model: MODELS.heavy,
      system,
      user: userMsg,
    });
    const parsed = JSON.parse(raw) as BrandSynthesisSuggestion;
    suggestions = sanitizeSuggestions(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Synthesis failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({ suggestions });
}

function sanitizeSuggestions(input: BrandSynthesisSuggestion): BrandSynthesisSuggestion {
  const out: BrandSynthesisSuggestion = {};

  const copyStr = (k: keyof BrandSynthesisSuggestion, v: unknown) => {
    if (typeof v === "string" && v.trim()) (out as Record<string, unknown>)[k as string] = v.trim();
  };

  copyStr("name", input.name);
  copyStr("tagline", input.tagline);
  copyStr("description", input.description);
  copyStr("voice", input.voice);
  copyStr("audience", input.audience);

  if (Array.isArray(input.products)) {
    const products = input.products
      .filter((p) => p && typeof p === "object")
      .map((p) => ({
        name: typeof (p as { name?: unknown }).name === "string" ? (p as { name: string }).name : "",
        type:
          typeof (p as { type?: unknown }).type === "string"
            ? ((p as { type: string }).type as string)
            : undefined,
        price:
          typeof (p as { price?: unknown }).price === "string"
            ? ((p as { price: string }).price as string)
            : undefined,
        description:
          typeof (p as { description?: unknown }).description === "string"
            ? ((p as { description: string }).description as string)
            : undefined,
      }))
      .filter((p) => p.name.trim());
    if (products.length) out.products = products;
  }

  const strArr = (v: unknown) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim())
      : [];

  const pillars = strArr(input.content_pillars);
  if (pillars.length) out.content_pillars = pillars;
  const pains = strArr(input.pain_points);
  if (pains.length) out.pain_points = pains;
  const comps = strArr(input.competitors);
  if (comps.length) out.competitors = comps;

  return out;
}
