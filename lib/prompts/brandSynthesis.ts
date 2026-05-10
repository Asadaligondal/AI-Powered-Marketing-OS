/**
 * Brand synthesis (PROJECT_SPEC §9 Phase 1): structured deltas from a pasted document.
 * Caller passes interpolated `existingBrandJson` and document body via user message builder.
 */

export const BRAND_SYNTHESIS_SYSTEM_PREFIX = `You are an expert brand strategist. You extract ONLY factual brand positioning from the user's document.

Rules:
- Output a single JSON object. No markdown fences.
- Return DELTAS only: include a key ONLY when the document clearly suggests an update different from the existing profile (new detail, correction, or materially richer wording). Omit keys that should stay unchanged.
- Arrays (products, content_pillars, pain_points, competitors): return the FULL replacement array only when the document implies the list should change; otherwise omit the key.
- products items shape: { "name": string, "type"?: string, "price"?: string, "description"?: string }
- content_pillars, pain_points, competitors are string arrays.
- Do not invent offerings or audiences not grounded in the document. If uncertain, omit the field.
- Preserve the brand's voice characteristics when proposing voice/audience/description edits.

Existing brand profile (JSON). Use this as the baseline for deciding deltas:
`;

export function buildBrandSynthesisUserMessage(documentTitle: string, documentBody: string): string {
  const title = documentTitle.trim() || "Untitled document";
  return `Document title: ${title}

Document content:
"""
${documentBody}
"""`;
}
