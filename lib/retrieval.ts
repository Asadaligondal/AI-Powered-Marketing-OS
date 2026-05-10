import { embed } from '@/lib/openai';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BrandRow } from '@/lib/types';

export type DocumentChunk = {
  content: string;
  similarity: number;
};

export type BrandContext = {
  brand: BrandRow;
  relevantChunks: DocumentChunk[];
};

export async function getBrandContext(brandId: string, topic: string): Promise<BrandContext> {
  const admin = createAdminClient();

  const { data: brand, error: brandError } = await admin
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .single();

  if (brandError || !brand) {
    throw new Error(brandError?.message ?? 'Brand not found');
  }

  const topicEmbedding = await embed(topic);

  let relevantChunks: DocumentChunk[] = [];
  try {
    const { data: chunks, error: chunksError } = await admin.rpc('match_brand_chunks', {
      query_embedding: topicEmbedding,
      match_brand_id: brandId,
      match_count: 3,
    });
    if (chunksError) {
      console.warn('[retrieval] similarity search failed:', chunksError.message);
    } else {
      relevantChunks = (chunks ?? []).map((c: { content: string; similarity: number }) => ({
        content: c.content,
        similarity: c.similarity,
      }));
    }
  } catch (e) {
    console.warn('[retrieval] chunk lookup error:', e instanceof Error ? e.message : String(e));
  }

  return { brand: brand as BrandRow, relevantChunks };
}
