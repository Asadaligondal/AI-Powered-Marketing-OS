import { redirect } from 'next/navigation';

import { getAuthUrl } from '@/lib/linkedin';

export async function GET() {
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
