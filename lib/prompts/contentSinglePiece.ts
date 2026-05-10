import type { DocumentChunk } from '@/lib/retrieval';
import type { BrandRow, ContentPiece, Platform } from '@/lib/types';

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  instagram_post:
    'Instagram Post: 1200–1500 chars max. Hook in first line. No hashtags in body — only in metadata.hashtags. Single CTA at end.',
  instagram_reel:
    'Instagram Reel: 15–30s vertical video. Hook must create a pattern interrupt in under 1.5s. Storyboard with 3–6 beats: each beat has shot (specific, visual), on_screen_text (max 5 words), voiceover. Body = full continuous voiceover.',
  tiktok:
    'TikTok: 30–60s. Rawer and more conversational than Reel. Higher pattern-interrupt energy. Direct camera address. Storyboard with 4–7 beats. trend_angle: note a relevant creator trend if it fits naturally, else null.',
  linkedin:
    'LinkedIn: 1200–2000 chars. Do NOT start with "I". Hook = contrarian claim, specific stat, or story setup. Use \\n\\n between every paragraph. End with ONE of: actionable takeaway OR comment-driving question — not both.',
  instagram_story:
    'Instagram Story: 1–3 frames. Each frame: text_overlay (2–6 words) + one interactive (poll, question sticker, countdown, or link sticker). Frame 1 hooks, Frame 2–3 deliver and close.',
};

const METADATA_SCHEMA: Record<Platform, string> = {
  instagram_post:
    '{ "hashtags": [...], "cta": "...", "hook_score": 0–100, "hook_score_reason": "..." }',
  instagram_reel:
    '{ "storyboard": [{ "beat": 1, "duration_s": 3, "shot": "...", "on_screen_text": "...", "voiceover": "..." }], "total_duration_s": 22, "music_vibe": "...", "cta": "...", "hook_score": 0–100, "hook_score_reason": "..." }',
  tiktok:
    '{ "storyboard": [...], "total_duration_s": 38, "trend_angle": null, "cta": "...", "hook_score": 0–100, "hook_score_reason": "..." }',
  linkedin:
    '{ "format": "story | insight | contrarian | how-to", "cta": "...", "hook_score": 0–100, "hook_score_reason": "..." }',
  instagram_story:
    '{ "frames": [{ "frame": 1, "text_overlay": "...", "interactive": "..." }], "cta": "...", "hook_score": 0–100, "hook_score_reason": "..." }',
};

export function buildContentSinglePiecePrompt(
  brand: BrandRow,
  relevantChunks: DocumentChunk[],
  topic: string,
  platform: Platform,
  previousAttempt: Pick<ContentPiece, 'hook' | 'body'>,
): { system: string; user: string } {
  const products = (brand.products ?? [])
    .map((p) => `• ${p.name}${p.price ? ` (${p.price})` : ''}`)
    .join('\n');

  const referenceMaterial =
    relevantChunks.length > 0
      ? `\n\nReference material:\n${relevantChunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n')}`
      : '';

  const system = `You are the content lead for ${brand.name}. Regenerate a single ${platform} piece for a new topic.

Voice: ${brand.voice ?? 'Direct, warm, mechanics-aware. No exclamation marks. No emojis unless essential. No wellness fluff.'}
Audience: ${brand.audience ?? 'Knowledge workers with desk-related pain, skeptical of generic wellness content.'}

Products:
${products || '• none listed'}
${referenceMaterial}

Platform constraint:
${PLATFORM_GUIDELINES[platform]}

Hook score guide — score ruthlessly. Rewrite until ≥65:
• 90+: Pattern interrupt + specific physical/scientific stakes + curiosity gap
• 75–89: Two of those three
• 60–74: One of those three
• <60: Generic — unacceptable

Make this meaningfully different from the previous attempt — different angle, different hook structure, different entry point into the topic.

Output a single JSON object with this exact shape (no markdown, no commentary):
{
  "platform": "${platform}",
  "hook": "...",
  "body": "...",
  "metadata": ${METADATA_SCHEMA[platform]}
}`;

  const prevBodyPreview = previousAttempt.body.length > 300
    ? previousAttempt.body.slice(0, 300) + '...'
    : previousAttempt.body;

  const user = `Topic: ${topic}

Previous attempt (take a different angle — different hook, different framing):
Hook: ${previousAttempt.hook}
Body preview: ${prevBodyPreview}

Generate a fresh ${platform} piece.`;

  return { system, user };
}
