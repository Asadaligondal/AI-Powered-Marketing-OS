-- Phase 4: add columns needed for Instagram DM capture and Klaviyo sync

alter table leads add column if not exists from_handle text;
alter table leads add column if not exists klaviyo_sync_error text;
