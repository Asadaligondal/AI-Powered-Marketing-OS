import { addDays, startOfDay } from 'date-fns';

import { openai, MODELS } from '@/lib/openai';
import { buildContentBatchPrompt } from '@/lib/prompts/contentBatch';
import { getBrandContext } from '@/lib/retrieval';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Platform } from '@/lib/types';

export const PLATFORM_SCHEDULED_TIMES: Record<Platform, [number, number]> = {
  linkedin: [9, 0],
  instagram_post: [12, 0],
  instagram_reel: [18, 0],
  tiktok: [19, 0],
  instagram_story: [20, 30],
};

type BatchResult = {
  batchId: string;
  piecesCreated: number;
  topic: string;
  tokenUsage: { total_tokens?: number } | undefined;
};

export async function generateContentBatch(
  brandId: string,
  topic: string,
  scheduledDate?: Date,
): Promise<BatchResult> {
  const admin = createAdminClient();

  const { data: brand, error: brandErr } = await admin
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .single();
  if (brandErr || !brand) throw new Error(brandErr?.message ?? 'Brand not found');

  const brandContext = await getBrandContext(brandId, topic);

  const { system, user } = buildContentBatchPrompt(brandContext.brand, brandContext.relevantChunks, topic);

  const completion = await openai.chat.completions.create({
    model: MODELS.default,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const tokenUsage = completion.usage ?? undefined;
  console.log('[openai]', MODELS.default, `batch["${topic.slice(0, 40)}"] tokens:`, tokenUsage?.total_tokens);

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { rationale?: string; pieces?: unknown[] };

  if (!Array.isArray(parsed.pieces) || parsed.pieces.length !== 5) {
    throw new Error(`AI returned ${String(parsed.pieces?.length ?? 0)} pieces (expected 5) for: ${topic}`);
  }

  const { data: batch, error: batchErr } = await admin
    .from('content_batches')
    .insert({ brand_id: brandId, topic, rationale: parsed.rationale ?? null })
    .select('id')
    .single();
  if (batchErr || !batch) throw new Error(batchErr?.message ?? 'Failed to create batch');

  const baseDate = scheduledDate ? startOfDay(scheduledDate) : null;

  const pieceRows = (parsed.pieces as Array<{ platform: Platform; hook: string; body: string; metadata: Record<string, unknown> }>)
    .map((p) => {
      let scheduledFor: string | null = null;
      if (baseDate) {
        const [h, m] = PLATFORM_SCHEDULED_TIMES[p.platform] ?? [9, 0];
        const d = new Date(baseDate);
        d.setHours(h, m, 0, 0);
        scheduledFor = d.toISOString();
      }
      return {
        batch_id: batch.id,
        brand_id: brandId,
        platform: p.platform,
        hook: p.hook,
        body: p.body,
        metadata: p.metadata,
        status: scheduledFor ? ('scheduled' as const) : ('draft' as const),
        scheduled_for: scheduledFor,
      };
    });

  const { error: piecesErr } = await admin.from('content_pieces').insert(pieceRows);
  if (piecesErr) throw new Error(piecesErr.message);

  return { batchId: batch.id, piecesCreated: pieceRows.length, topic, tokenUsage };
}

export async function runBatched<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<(R | null)[]> {
  const results: (R | null)[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const settled = await Promise.allSettled(chunk.map((item, j) => fn(item, i + j)));
    for (const r of settled) {
      results.push(r.status === 'fulfilled' ? r.value : null);
      if (r.status === 'rejected') {
        console.error('[runBatched] item failed:', r.reason instanceof Error ? r.reason.message : String(r.reason));
      }
    }
  }
  return results;
}

// Unused import removal
void addDays;
