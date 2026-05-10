import { createPost } from '@/lib/linkedin';
import { createAdminClient } from '@/lib/supabase/admin';

type PublishResult = {
  success: boolean;
  real: boolean;
  external_id?: string;
  error?: string;
};

export async function publishPiece(pieceId: string): Promise<PublishResult> {
  const admin = createAdminClient();

  const { data: piece, error: pieceErr } = await admin
    .from('content_pieces')
    .select('*')
    .eq('id', pieceId)
    .single();

  if (pieceErr || !piece) {
    throw new Error(pieceErr?.message ?? 'Piece not found');
  }

  await admin
    .from('content_pieces')
    .update({ status: 'publishing', updated_at: new Date().toISOString() })
    .eq('id', pieceId);

  if (piece.platform === 'linkedin') {
    const { data: conn } = await admin
      .from('platform_connections')
      .select('access_token, external_account_id, is_mocked')
      .eq('brand_id', piece.brand_id)
      .eq('platform', 'linkedin')
      .maybeSingle();

    if (conn && !conn.is_mocked && conn.access_token) {
      try {
        const postId = await createPost(
          conn.access_token as string,
          conn.external_account_id as string,
          piece.body as string,
        );
        await admin
          .from('content_pieces')
          .update({
            status: 'published',
            external_id: postId,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', pieceId);
        await admin.from('activity_log').insert({
          brand_id: piece.brand_id,
          action: 'post_published',
          details: { piece_id: pieceId, platform: 'linkedin', real_or_mocked: 'real', external_id: postId },
        });
        return { success: true, real: true, external_id: postId };
      } catch (e) {
        const err = e instanceof Error ? e.message : 'LinkedIn publish failed';
        await admin
          .from('content_pieces')
          .update({
            status: 'failed',
            publish_error: err,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pieceId);
        await admin.from('activity_log').insert({
          brand_id: piece.brand_id,
          action: 'post_published',
          details: { piece_id: pieceId, platform: 'linkedin', real_or_mocked: 'real', error: err },
        });
        return { success: false, real: true, error: err };
      }
    }
  }

  // Mocked publish for all other platforms (or LinkedIn without connection)
  await new Promise<void>((r) => setTimeout(r, 1500));

  const suffix = Math.random().toString(36).slice(2, 12);
  const fakeId = `mock_${String(piece.platform)}_${suffix}`;
  const currentMeta = (piece.metadata as Record<string, unknown>) ?? {};

  await admin
    .from('content_pieces')
    .update({
      status: 'published',
      external_id: fakeId,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { ...currentMeta, is_mocked: true },
    })
    .eq('id', pieceId);

  await admin.from('activity_log').insert({
    brand_id: piece.brand_id,
    action: 'post_published',
    details: { piece_id: pieceId, platform: piece.platform, real_or_mocked: 'mocked', external_id: fakeId },
  });

  return { success: true, real: false, external_id: fakeId };
}
