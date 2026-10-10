import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { env } from '../../../../../lib/env';

export async function GET(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'google-ads_oauth_authorize_get', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const supabase = await createClient();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const organizationId = searchParams.get('organizationId');

    if (!projectId || !organizationId) {
      return NextResponse.json({ error: 'Missing projectId or organizationId' }, { status: 400 });
    }

    // Verify access
    // Replaced manual org check with centralized auth
await requireOrganizationMember(supabase, userId, organizationId);


    if (!env.GOOGLE_ADS_CLIENT_ID) {
      return NextResponse.json({ error: 'Google Ads OAuth not configured' }, { status: 500 });
    }

    // Store state in redis or pass via state parameter (encrypted or JWT)
    // For simplicity, we can serialize it into the state string as base64 JSON
    const stateObj = { projectId, organizationId, userId: userId };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
    
    const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/google-ads/oauth/callback`;
    const scope = 'https://www.googleapis.com/auth/adwords';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_ADS_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`;

    return NextResponse.json({ url: authUrl });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
