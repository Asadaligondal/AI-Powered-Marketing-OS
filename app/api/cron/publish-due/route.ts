import { NextResponse } from 'next/server';

import { publishPiece } from '@/lib/publishPiece';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: duePieces, error } = await admin
    .from('content_pieces')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!duePieces?.length) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0 });
  }

  let succeeded = 0;
  let failed = 0;

  for (const { id } of duePieces) {
    try {
      const result = await publishPiece(id);
      if (result.success) succeeded++;
      else failed++;
    } catch (e) {
      console.error('[cron] publish failed for', id, e instanceof Error ? e.message : String(e));
      await admin
        .from('content_pieces')
        .update({ status: 'failed', publish_error: e instanceof Error ? e.message : 'Unknown error' })
        .eq('id', id);
      failed++;
    }
  }

  console.log(`[cron] publish-due: processed=${duePieces.length} succeeded=${succeeded} failed=${failed}`);
  return NextResponse.json({ processed: duePieces.length, succeeded, failed });
}
