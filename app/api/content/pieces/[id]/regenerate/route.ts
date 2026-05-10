import { NextResponse } from 'next/server';

import { openai, MODELS } from '@/lib/openai';
import { buildContentSinglePiecePrompt } from '@/lib/prompts/contentSinglePiece';
import { getBrandContext } from '@/lib/retrieval';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Platform } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RegeneratedPiece = {
  platform: Platform;
  hook: string;
  body: string;
  metadata: Record<string, unknown>;
};

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: piece, error: pieceErr } = await admin
    .from('content_pieces')
    .select('*, content_batches!inner(topic, brand_id)')
    .eq('id', id)
    .single();

  if (pieceErr || !piece) {
    return NextResponse.json({ error: pieceErr?.message ?? 'Piece not found' }, { status: 404 });
  }

  const batchMeta = piece.content_batches as { topic: string; brand_id: string };

  const { data: brand, error: brandErr } = await supabase
    .from('brands')
    .select('id')
    .eq('id', batchMeta.brand_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (brandErr || !brand) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const topic = batchMeta.topic;
  let brandContext: Awaited<ReturnType<typeof getBrandContext>>;
  try {
    brandContext = await getBrandContext(piece.brand_id as string, topic);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Brand context retrieval failed' },
      { status: 500 },
    );
  }

  const { system, user: userMsg } = buildContentSinglePiecePrompt(
    brandContext.brand,
    brandContext.relevantChunks,
    topic,
    piece.platform as Platform,
    { hook: piece.hook as string, body: piece.body as string },
  );

  let newPiece: RegeneratedPiece;
  let tokenUsage: { total_tokens?: number } | undefined;

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.default,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });
    tokenUsage = completion.usage ?? undefined;
    console.log('[openai]', MODELS.default, 'regen tokens:', tokenUsage);
    const raw = completion.choices[0]?.message?.content ?? '{}';
    newPiece = JSON.parse(raw) as RegeneratedPiece;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'OpenAI call failed';
    console.error('[content/pieces/regenerate] error:', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (!newPiece.hook || !newPiece.body) {
    console.error('[content/pieces/regenerate] incomplete piece:', JSON.stringify(newPiece).slice(0, 400));
    return NextResponse.json({ error: 'AI returned an incomplete piece' }, { status: 500 });
  }

  const { data: updated, error: updateErr } = await admin
    .from('content_pieces')
    .update({
      hook: newPiece.hook,
      body: newPiece.body,
      metadata: newPiece.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: updateErr?.message ?? 'Failed to update piece' },
      { status: 500 },
    );
  }

  return NextResponse.json({ piece: updated });
}
