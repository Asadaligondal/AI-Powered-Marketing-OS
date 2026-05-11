import type { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';

import { getAuthUrl } from '@/lib/linkedin';
import { handleLinkedInOAuthCallback } from '@/lib/linkedin/oauth-callback';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.has('code') || sp.has('error')) {
    return handleLinkedInOAuthCallback(req);
  }

  const state = Math.random().toString(36).slice(2, 18);
  let url: string;
  try {
    url = getAuthUrl(state);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'LinkedIn not configured';
    return new Response(msg, { status: 500 });
  }
  redirect(url);
}
