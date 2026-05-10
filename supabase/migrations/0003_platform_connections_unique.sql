-- Add unique constraint for LinkedIn upsert (Phase 3)
alter table platform_connections
  add constraint platform_connections_brand_platform_unique
  unique (brand_id, platform);
