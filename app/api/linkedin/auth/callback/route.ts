import { handleLinkedInOAuthCallback } from '@/lib/linkedin/oauth-callback';

export async function GET(req: Request) {
  return handleLinkedInOAuthCallback(req);
}
