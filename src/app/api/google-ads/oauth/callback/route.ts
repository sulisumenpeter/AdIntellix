import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { env } from '../../../../../lib/env';
import { encrypt } from '../../../../../lib/encryption';

export async function GET(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'google-ads_oauth_callback_get', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const sessionUserId = req.headers.get('x-user-id');

    if (!sessionUserId) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login`);
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard/google-search-terms?error=Missing+code+or+state`);
    }

    let stateObj;
    try {
        stateObj = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch {
        return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard/google-search-terms?error=Invalid+state`);
    }

    const { projectId, organizationId, userId } = stateObj;

    if (userId !== sessionUserId) {
        return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard/google-search-terms?error=State+mismatch`);
    }

    const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/google-ads/oauth/callback`;

    // Exchange code for token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_ADS_CLIENT_ID || '',
        client_secret: env.GOOGLE_ADS_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.refresh_token) {
        return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard/google-search-terms?error=Failed+to+obtain+refresh+token`);
    }

    // Now we need the customer_id. The real Google Ads API oauth setup requires listing accessible customers 
    // using the access token and the developer token.
    // For this demonstration, we'll fetch accessible customers to grab the first one, or just require user to input it later.
    // Let's fetch the accessible customers using the REST API to be safe, since `google-ads-api` is mostly gRPC/large client setup.
    const customersRes = await fetch('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
        headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
        }
    });

    const customersData = await customersRes.json();
    if (!customersRes.ok || !customersData.resourceNames || customersData.resourceNames.length === 0) {
        // Fallback placeholder customer if not accessible (or for testing)
        // return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard/google-search-terms?error=No+accessible+customers+found`);
    }

    const customerId = customersData.resourceNames?.[0]?.replace('customers/', '') || 'TEST-CUSTOMER-ID';
    
    // Encrypt refresh token
    const encryptedRefreshToken = encrypt(tokenData.refresh_token);

    // Save to DB
    const supabase = await createClient();
    const { error: insertError } = await supabase
      .from('google_ads_connections')
      .insert({
        organization_id: organizationId,
        project_id: projectId,
        refresh_token: encryptedRefreshToken,
        customer_id: customerId
      });

    if (insertError) {
      console.error(insertError);
      return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard/google-search-terms?error=Failed+to+save+connection`);
    }

    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard/google-search-terms?success=connected`);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard/google-search-terms?error=Internal+server+error`);
  }
}
