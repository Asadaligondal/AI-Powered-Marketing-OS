import { createProfile, subscribeToList } from '@/lib/klaviyo';
import { findRuleForKeyword } from '@/lib/automation-rules';
import { createAdminClient } from '@/lib/supabase/admin';

export type SyncResult =
  | { synced: true; profileId: string }
  | { skipped: true; reason: string }
  | { failed: true; error: string };

export async function syncLeadToKlaviyo(leadId: string): Promise<SyncResult> {
  const admin = createAdminClient();

  const { data: lead, error } = await admin.from('leads').select('*').eq('id', leadId).single();
  if (error || !lead) return { failed: true, error: 'Lead not found' };

  const email = lead.email as string | null;
  if (!email) return { skipped: true, reason: 'no_email' };

  if (!process.env.KLAVIYO_PRIVATE_API_KEY) {
    await admin
      .from('leads')
      .update({ klaviyo_sync_error: 'credentials_not_configured' })
      .eq('id', leadId);
    return { skipped: true, reason: 'credentials_not_configured' };
  }

  try {
    const nameParts = ((lead.name as string | null) ?? '').split(' ').filter(Boolean);
    const firstName = nameParts[0] ?? null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    const profileId = await createProfile({
      email,
      firstName,
      lastName,
      properties: {
        source: (lead.source as string | null) ?? 'instagram_dm',
        keyword: (lead.keyword as string | null) ?? null,
        interests: (lead.extracted_interests as string[]) ?? [],
        from_handle: (lead.from_handle as string | null) ?? null,
      },
    });

    const rule = findRuleForKeyword(lead.keyword as string | null);
    const listId = rule?.listId;
    if (listId) {
      await subscribeToList(profileId, listId, email);
    }

    await admin
      .from('leads')
      .update({
        klaviyo_profile_id: profileId,
        klaviyo_synced_at: new Date().toISOString(),
        klaviyo_sync_error: null,
      })
      .eq('id', leadId);

    await admin.from('activity_log').insert({
      brand_id: lead.brand_id,
      action: 'klaviyo_synced',
      details: {
        lead_id: leadId,
        profile_id: profileId,
        list_id: listId ?? null,
        email,
      },
    });

    return { synced: true, profileId };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[klaviyo] sync failed for lead', leadId, errMsg);
    await admin.from('leads').update({ klaviyo_sync_error: errMsg }).eq('id', leadId);
    return { failed: true, error: errMsg };
  }
}
