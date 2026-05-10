import { endOfMonth, startOfMonth } from 'date-fns';
import { redirect } from 'next/navigation';

import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/server';
import type { ContentPiece } from '@/lib/types';

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: brand } = await supabase
    .from('brands')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!brand) redirect('/brand');

  const now = new Date();
  const start = startOfMonth(now).toISOString();
  const end = endOfMonth(now).toISOString();

  const [{ data: pieces }, { data: linkedInConn }] = await Promise.all([
    supabase
      .from('content_pieces')
      .select('*')
      .eq('brand_id', brand.id)
      .gte('scheduled_for', start)
      .lte('scheduled_for', end)
      .order('scheduled_for', { ascending: true }),
    supabase
      .from('platform_connections')
      .select('account_handle, is_mocked')
      .eq('brand_id', brand.id)
      .eq('platform', 'linkedin')
      .maybeSingle(),
  ]);

  const linkedIn = {
    connected: !!linkedInConn,
    handle: linkedInConn?.account_handle ?? undefined,
    isMocked: linkedInConn?.is_mocked ?? false,
  };

  return (
    <div className="pb-16">
      <PageHeader
        title="Content Calendar"
        subtitle={`${brand.name} — schedule, drag to reschedule, and publish.`}
      />
      <CalendarGrid
        initialPieces={(pieces as ContentPiece[]) ?? []}
        initialMonth={now.toISOString()}
        brandId={brand.id}
        linkedIn={linkedIn}
      />
    </div>
  );
}
