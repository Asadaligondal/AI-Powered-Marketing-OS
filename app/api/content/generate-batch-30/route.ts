import { addDays, startOfTomorrow } from 'date-fns';
import { NextResponse } from 'next/server';

import { generateContentBatch, runBatched } from '@/lib/generateContentBatch';
import { openai, MODELS } from '@/lib/openai';
import { buildContentPlanPrompt } from '@/lib/prompts/contentPlan';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: brand, error: brandErr } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (brandErr) return NextResponse.json({ error: brandErr.message }, { status: 500 });
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  // Step 1: Plan 30 topics
  const { system, user: userMsg } = buildContentPlanPrompt(brand);
  let topics: string[];

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.default,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });
    console.log('[openai] content-plan tokens:', completion.usage);
    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as { topics?: string[] };
    topics = Array.isArray(parsed.topics) ? parsed.topics.slice(0, 30) : [];
    if (topics.length < 30) {
      return NextResponse.json(
        { error: `AI returned only ${topics.length} topics (need 30)` },
        { status: 500 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Topic planning failed';
    console.error('[batch-30] planning error:', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Step 2: Generate batches in parallel, 5 at a time
  const startDate = startOfTomorrow();
  let batchesCreated = 0;
  let piecesCreated = 0;
  let totalTokens = 0;

  const results = await runBatched(topics, 5, async (topic, i) => {
    const scheduledDate = addDays(startDate, i);
    const result = await generateContentBatch(brand.id, topic, scheduledDate);
    totalTokens += result.tokenUsage?.total_tokens ?? 0;
    console.log(`[batch-30] day ${i + 1}/30: "${topic.slice(0, 50)}" — ${result.piecesCreated} pieces`);
    return result;
  });

  for (const r of results) {
    if (r) {
      batchesCreated++;
      piecesCreated += r.piecesCreated;
    }
  }

  const admin = createAdminClient();
  await admin.from('activity_log').insert({
    brand_id: brand.id,
    action: 'calendar_generated',
    details: { batches_created: batchesCreated, pieces_created: piecesCreated, total_tokens: totalTokens },
  });

  console.log(`[batch-30] done: ${batchesCreated} batches, ${piecesCreated} pieces, ~${totalTokens} tokens`);
  return NextResponse.json({ batchesCreated, piecesCreated, totalTokens });
}
