import { notFound, redirect } from 'next/navigation';

import { ContentCard } from '@/components/content/ContentCard';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/server';
import type { ContentPiece } from '@/lib/types';

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: batch } = await supabase
    .from('content_batches')
    .select('*, brands!inner(user_id)')
    .eq('id', batchId)
    .maybeSingle();

  if (!batch || (batch.brands as { user_id: string }).user_id !== user.id) {
    notFound();
  }

  const { data: pieces } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-2">
        <PageHeader
          title={batch.topic as string}
          subtitle={
            (batch.rationale as string | null) ??
            'Content batch — all 5 platform pieces for this topic.'
          }
        />
        <a
          href="/content"
          className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Content Studio
        </a>
      </div>

      {pieces && pieces.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {pieces.map((piece) => (
            <ContentCard key={piece.id} piece={piece as ContentPiece} />
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">No pieces found for this batch.</p>
      )}
    </div>
  );
}
