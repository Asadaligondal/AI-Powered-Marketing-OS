import { redirect } from 'next/navigation';

import { LeadsPageClient } from '@/components/leads/leads-page-client';
import { AUTOMATION_RULES_DISPLAY } from '@/lib/automation-rules';
import { createClient } from '@/lib/supabase/server';
import type { Lead } from '@/lib/types';

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!brand) redirect('/brand');

  const [{ data: leads, count }, { data: recentActivity }] = await Promise.all([
    supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('activity_log')
      .select('id, action, details, created_at')
      .eq('brand_id', brand.id)
      .in('action', ['lead_captured', 'klaviyo_synced'])
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return (
    <LeadsPageClient
      leads={(leads as Lead[]) ?? []}
      totalCount={count ?? 0}
      automationRules={AUTOMATION_RULES_DISPLAY}
      recentActivity={
        (recentActivity as { id: string; action: string; details: Record<string, unknown> | null; created_at: string }[]) ?? []
      }
    />
  );
}
