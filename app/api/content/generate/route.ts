import { NextResponse } from 'next/server';

import { openai, MODELS } from '@/lib/openai';
import { buildContentBatchPrompt } from '@/lib/prompts/contentBatch';
import { getBrandContext } from '@/lib/retrieval';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Platform } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const EXPECTED_PLATFORMS: Platform[] = [
  'instagram_post',
  'instagram_reel',
  'tiktok',
  'linkedin',
  'instagram_story',
];

type RawPiece = {
  platform: Platform;
  hook: string;
  body: string;
  metadata: Record<string, unknown>;
};

type BatchResponse = {
  rationale: string;
  pieces: RawPiece[];
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const topic =
    typeof (body as { topic?: unknown }).topic === 'string'
      ? (body as { topic: string }).topic.trim()
      : '';
  if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });

  const { data: brand, error: brandErr } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (brandErr) return NextResponse.json({ error: brandErr.message }, { status: 500 });
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  let brandContext: Awaited<ReturnType<typeof getBrandContext>>;
  try {
    brandContext = await getBrandContext(brand.id, topic);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Brand context retrieval failed' },
      { status: 500 },
    );
  }

  const { system, user: userMsg } = buildContentBatchPrompt(
    brandContext.brand,
    brandContext.relevantChunks,
    topic,
  );

  let parsed: BatchResponse;
  let tokenUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.default,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });
    tokenUsage = completion.usage ?? undefined;
    console.log('[openai]', MODELS.default, 'content-batch tokens:', tokenUsage);
    const raw = completion.choices[0]?.message?.content ?? '{}';
    parsed = JSON.parse(raw) as BatchResponse;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'OpenAI call failed';
    console.error('[content/generate] OpenAI error:', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (!parsed.rationale || !Array.isArray(parsed.pieces) || parsed.pieces.length !== 5) {
    console.error(
      '[content/generate] unexpected AI response shape:',
      JSON.stringify(parsed).slice(0, 600),
    );
    return NextResponse.json(
      { error: 'AI returned unexpected structure — expected exactly 5 pieces with a rationale.' },
      { status: 500 },
    );
  }

  const returnedPlatforms = parsed.pieces.map((p) => p.platform);
  for (const expected of EXPECTED_PLATFORMS) {
    if (!returnedPlatforms.includes(expected)) {
      console.error('[content/generate] missing platform:', expected);
      return NextResponse.json({ error: `AI response missing platform: ${expected}` }, { status: 500 });
    }
  }

  const admin = createAdminClient();

  const { data: batch, error: batchErr } = await admin
    .from('content_batches')
    .insert({ brand_id: brand.id, topic, rationale: parsed.rationale })
    .select('id')
    .single();
  if (batchErr || !batch) {
    return NextResponse.json(
      { error: batchErr?.message ?? 'Failed to create content batch' },
      { status: 500 },
    );
  }

  const pieceRows = parsed.pieces.map((p) => ({
    batch_id: batch.id,
    brand_id: brand.id,
    platform: p.platform,
    hook: p.hook,
    body: p.body,
    metadata: p.metadata,
    status: 'draft' as const,
  }));

  const { data: insertedPieces, error: piecesErr } = await admin
    .from('content_pieces')
    .insert(pieceRows)
    .select('*');
  if (piecesErr || !insertedPieces) {
    return NextResponse.json(
      { error: piecesErr?.message ?? 'Failed to insert content pieces' },
      { status: 500 },
    );
  }

  await admin.from('activity_log').insert({
    brand_id: brand.id,
    action: 'content_generated',
    details: {
      topic,
      batch_id: batch.id,
      model: MODELS.default,
      tokens: tokenUsage,
    },
  });

  return NextResponse.json({ batchId: batch.id, pieces: insertedPieces });
}
