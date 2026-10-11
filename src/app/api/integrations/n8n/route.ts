import { NextResponse } from 'next/server';
import { requireOrganizationMember } from '@/lib/authorization';
import { valkey } from '@/lib/redis/valkey';
import { n8n } from '@/lib/n8n/n8n-client';
import { encrypt } from '@/lib/encryption';

export async function GET(req: Request) {
  try {
    const orgId = req.headers.get('x-organization-id');
    if (!orgId) return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });

    const authReq = { ...req, headers: req.headers } as unknown as Request;
    const authResult = await requireOrganizationMember(authReq, orgId, ['owner', 'admin']);
    if (authResult) return authResult;

    const url = await valkey.get(`org:${orgId}:n8n:url`);
    const hasApiKey = await valkey.exists(`org:${orgId}:n8n:apiKey`);

    return NextResponse.json({
      url: url || '',
      hasApiKey: hasApiKey === 1
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const orgId = req.headers.get('x-organization-id');
    if (!orgId) return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });

    const authReq = { ...req, headers: req.headers } as unknown as Request;
    const authResult = await requireOrganizationMember(authReq, orgId, ['owner', 'admin']);
    if (authResult) return authResult;

    const body = await req.json();
    const { action, url, apiKey } = body;

    if (action === 'save') {
      if (url !== undefined) {
        await valkey.set(`org:${orgId}:n8n:url`, url);
      }
      if (apiKey) {
        const encryptedKey = encrypt(apiKey);
        await valkey.set(`org:${orgId}:n8n:apiKey`, encryptedKey);
      }
      return NextResponse.json({ success: true });
    }
    
    if (action === 'test') {
      // Use the global n8n client to test the connectivity
      await n8n.triggerWorkflow('test-connection-webhook', { organizationId: orgId, test: true });
      return NextResponse.json({ success: true, message: 'Test webhook sent successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
