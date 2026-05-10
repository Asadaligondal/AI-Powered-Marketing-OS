import { NextResponse } from 'next/server';

import { publishPiece } from '@/lib/publishPiece';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

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

  const { pieceId } = body as { pieceId?: string };
  if (!pieceId) return NextResponse.json({ error: 'pieceId is required' }, { status: 400 });

  const admin = createAdminClient();
  const { data: piece } = await admin
    .from('content_pieces')
    .select('brand_id, brands!inner(user_id)')
    .eq('id', pieceId)
    .single();

  if (!piece || (piece.brands as unknown as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await publishPiece(pieceId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Publish failed' },
      { status: 500 },
    );
  }
}
