import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  const { scheduledFor } = body as { scheduledFor?: string };
  if (!scheduledFor) return NextResponse.json({ error: 'scheduledFor is required' }, { status: 400 });

  const admin = createAdminClient();

  const { data: piece } = await admin
    .from('content_pieces')
    .select('brand_id, scheduled_for, brands!inner(user_id)')
    .eq('id', id)
    .single();

  if (!piece || (piece.brands as unknown as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error } = await admin
    .from('content_pieces')
    .update({
      scheduled_for: scheduledFor,
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !updated) return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 });
  return NextResponse.json({ piece: updated });
}
