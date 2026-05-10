-- Vector similarity search for brand document chunks (Phase 2 RAG retrieval)
create or replace function match_brand_chunks(
  query_embedding float8[],
  match_brand_id uuid,
  match_count int default 3
)
returns table(content text, similarity float)
language sql stable
as $$
  select
    bdc.content,
    (1 - (bdc.embedding <=> query_embedding::vector))::float as similarity
  from brand_document_chunks bdc
  where bdc.brand_id = match_brand_id
    and bdc.embedding is not null
  order by bdc.embedding <=> query_embedding::vector
  limit match_count;
$$;
