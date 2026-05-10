import { NextResponse } from 'next/server';

import { findRuleForKeyword } from '@/lib/automation-rules';
import { MODELS, chatJsonCompletion } from '@/lib/openai';
import { buildDmExtractPrompt } from '@/lib/prompts/dmExtract';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { syncLeadToKlaviyo } from '@/lib/sync-to-klaviyo';

export const runtime = 'nodejs';

type DmExtraction = {
  keyword: string | null;
  intent: string;
  name: string | null;
  email: string | null;
  interests: string[];
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

  const { message, fromHandle } = body as { message?: string; fromHandle?: string };
  if (!message?.trim()) return NextResponse.json({ error: 'message is required' }, { status: 400 });

  const admin = createAdminClient();
  const { data: brand } = await admin
    .from('brands')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  // AI extraction using cheap model
  const { system, user: userPrompt } = buildDmExtractPrompt(message);
  const { raw, usage } = await chatJsonCompletion({
    model: MODELS.cheap,
    system,
    user: userPrompt,
  });

  console.log(`[dm-parse] ${MODELS.cheap} tokens: ${usage?.total_tokens ?? 'unknown'}`);

  let extracted: DmExtraction;
  try {
    const parsed = JSON.parse(raw) as Partial<DmExtraction>;
    extracted = {
      keyword: typeof parsed.keyword === 'string' ? parsed.keyword : null,
      intent: typeof parsed.intent === 'string' ? parsed.intent : 'unclear',
      name: typeof parsed.name === 'string' ? parsed.name : null,
      email: typeof parsed.email === 'string' ? parsed.email : null,
      interests: Array.isArray(parsed.interests) ? (parsed.interests as string[]) : [],
    };
  } catch {
    extracted = { keyword: null, intent: 'unclear', name: null, email: null, interests: [] };
  }

  // Insert lead
  const { data: lead, error: leadErr } = await admin
    .from('leads')
    .insert({
      brand_id: brand.id,
      source: 'instagram_dm',
      keyword: extracted.keyword,
      name: extracted.name,
      email: extracted.email,
      raw_message: message,
      extracted_interests: extracted.interests,
      from_handle: fromHandle ?? null,
    })
    .select('id')
    .single();

  if (leadErr || !lead) {
    return NextResponse.json(
      { error: leadErr?.message ?? 'Failed to create lead' },
      { status: 500 },
    );
  }

  // Activity log: lead captured
  await admin.from('activity_log').insert({
    brand_id: brand.id,
    action: 'lead_captured',
    details: {
      lead_id: lead.id,
      keyword: extracted.keyword,
      source: 'instagram_dm',
      ai_extraction_summary: `intent=${extracted.intent}, email=${extracted.email ?? 'none'}, interests=[${extracted.interests.join(', ')}]`,
      tokens: usage?.total_tokens,
    },
  });

  // Klaviyo sync — only if email + matching automation rule
  let klaviyoSynced = false;
  const rule = findRuleForKeyword(extracted.keyword);
  if (extracted.email && rule) {
    const result = await syncLeadToKlaviyo(lead.id);
    klaviyoSynced = 'synced' in result && result.synced === true;
  }

  return NextResponse.json({ leadId: lead.id, extracted, klaviyoSynced });
}
