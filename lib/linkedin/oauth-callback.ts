import { NextResponse } from 'next/server';

import { exchangeCodeForToken, getProfile } from '@/lib/linkedin';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/** Shared handler for LinkedIn redirect — supports both `/api/linkedin/auth` and `/api/linkedin/auth/callback` as redirect_uri. */
export async function handleLinkedInOAuthCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (error || !code) {
    console.error('[linkedin] OAuth error:', error);
    return NextResponse.redirect(`${appUrl}/calendar?error=linkedin_auth`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl}/login`);

  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!brand) return NextResponse.redirect(`${appUrl}/calendar?error=no_brand`);

  try {
    const tokenData = await exchangeCodeForToken(code);
    const profile = await getProfile(tokenData.access_token);

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    const handle = profile.name ?? profile.given_name ?? 'LinkedIn User';

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('platform_connections')
      .select('id')
      .eq('brand_id', brand.id)
      .eq('platform', 'linkedin')
      .maybeSingle();

    const connData = {
      brand_id: brand.id,
      platform: 'linkedin',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      expires_at: expiresAt,
      external_account_id: profile.sub,
      account_handle: handle,
      is_mocked: false,
    };

    if (existing) {
      await admin.from('platform_connections').update(connData).eq('id', existing.id);
    } else {
      await admin.from('platform_connections').insert(connData);
    }

    await admin.from('activity_log').insert({
      brand_id: brand.id,
      action: 'linkedin_connected',
      details: { linkedin_urn: profile.sub, name: handle },
    });

    console.log('[linkedin] connected:', profile.sub, handle);
    return NextResponse.redirect(`${appUrl}/calendar?connected=linkedin`);
  } catch (e) {
    console.error('[linkedin] callback error:', e instanceof Error ? e.message : String(e));
    return NextResponse.redirect(`${appUrl}/calendar?error=linkedin_token`);
  }
}
