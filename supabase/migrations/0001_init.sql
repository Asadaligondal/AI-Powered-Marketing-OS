-- AI Marketing OS — initial schema (PROJECT_SPEC §6)

create extension if not exists vector;

-- BRANDS
create table brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  tagline text,
  description text,
  voice text,
  audience text,
  products jsonb default '[]'::jsonb,
  content_pillars jsonb default '[]'::jsonb,
  pain_points jsonb default '[]'::jsonb,
  competitors jsonb default '[]'::jsonb,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BRAND DOCUMENTS (RAG corpus)
create table brand_documents (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  title text,
  source_type text,
  raw_content text,
  created_at timestamptz default now()
);

create table brand_document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references brand_documents(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  chunk_index int,
  content text,
  embedding vector(1536),
  created_at timestamptz default now()
);

create index brand_document_chunks_embedding_ivfflat
  on brand_document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- CONTENT
create type platform as enum (
  'instagram_post', 'instagram_reel', 'tiktok', 'linkedin', 'instagram_story'
);
create type content_status as enum (
  'draft', 'scheduled', 'publishing', 'published', 'failed'
);

create table content_batches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  topic text not null,
  rationale text,
  created_at timestamptz default now()
);

create table content_pieces (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references content_batches(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  platform platform not null,
  hook text,
  body text,
  metadata jsonb default '{}'::jsonb,
  status content_status default 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  external_id text,
  publish_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index content_pieces_brand_scheduled on content_pieces (brand_id, scheduled_for);
create index content_pieces_status on content_pieces (status);

-- LEADS
create table leads (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  source text,
  keyword text,
  name text,
  email text,
  raw_message text,
  extracted_interests jsonb default '[]'::jsonb,
  klaviyo_profile_id text,
  klaviyo_synced_at timestamptz,
  created_at timestamptz default now()
);

-- PLATFORM CONNECTIONS
create table platform_connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  platform text not null,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  external_account_id text,
  account_handle text,
  is_mocked boolean default false,
  connected_at timestamptz default now()
);

-- ACTIVITY LOG
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  action text,
  details jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table brands enable row level security;
alter table brand_documents enable row level security;
alter table brand_document_chunks enable row level security;
alter table content_batches enable row level security;
alter table content_pieces enable row level security;
alter table leads enable row level security;
alter table platform_connections enable row level security;
alter table activity_log enable row level security;

-- brands: owner via user_id (no brand_id column)
create policy brands_select on brands
  for select using (user_id = auth.uid());
create policy brands_insert on brands
  for insert with check (user_id = auth.uid());
create policy brands_update on brands
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy brands_delete on brands
  for delete using (user_id = auth.uid());

-- tables keyed by brand_id
create policy brand_documents_all on brand_documents
  for all
  using (brand_id in (select id from brands where user_id = auth.uid()))
  with check (brand_id in (select id from brands where user_id = auth.uid()));

create policy brand_document_chunks_all on brand_document_chunks
  for all
  using (brand_id in (select id from brands where user_id = auth.uid()))
  with check (brand_id in (select id from brands where user_id = auth.uid()));

create policy content_batches_all on content_batches
  for all
  using (brand_id in (select id from brands where user_id = auth.uid()))
  with check (brand_id in (select id from brands where user_id = auth.uid()));

create policy content_pieces_all on content_pieces
  for all
  using (brand_id in (select id from brands where user_id = auth.uid()))
  with check (brand_id in (select id from brands where user_id = auth.uid()));

create policy leads_all on leads
  for all
  using (brand_id in (select id from brands where user_id = auth.uid()))
  with check (brand_id in (select id from brands where user_id = auth.uid()));

create policy platform_connections_all on platform_connections
  for all
  using (brand_id in (select id from brands where user_id = auth.uid()))
  with check (brand_id in (select id from brands where user_id = auth.uid()));

create policy activity_log_all on activity_log
  for all
  using (brand_id in (select id from brands where user_id = auth.uid()))
  with check (brand_id in (select id from brands where user_id = auth.uid()));
