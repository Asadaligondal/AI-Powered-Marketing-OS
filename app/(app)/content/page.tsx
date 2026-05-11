import { redirect } from 'next/navigation';

import { ContentStudio } from '@/components/content/ContentStudio';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/server';
import type { RecentBatch } from '@/lib/types';

export default async function ContentPage() {
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

  let recentBatches: RecentBatch[] = [];
  if (brand) {
    const { data } = await supabase
      .from('content_batches')
      .select('id, topic, created_at')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })
      .limit(10);
    recentBatches = (data ?? []) as RecentBatch[];
  }

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title={
          <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-clip-text text-transparent">
            Content Studio
          </span>
        }
        subtitle="Type a topic — get 5 platform-specific pieces in under 25 seconds."
      />
      <ContentStudio recentBatches={recentBatches} />
    </div>
  );
}
