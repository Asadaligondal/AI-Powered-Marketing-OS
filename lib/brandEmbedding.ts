import type { BrandRow } from "@/lib/types";

/** Embedding corpus for the brand row (PROJECT_SPEC Phase 1 seed + save). */
export function brandEmbeddingSource(b: Pick<BrandRow, "name" | "tagline" | "description" | "voice" | "audience">): string {
  return [
    b.name,
    b.tagline ?? "",
    b.description ?? "",
    b.voice ?? "",
    b.audience ?? "",
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n\n");
}
