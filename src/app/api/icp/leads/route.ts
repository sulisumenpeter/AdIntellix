import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../lib/authorization';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../../../lib/env';
import { z } from 'zod';
import { createQueue, QUEUE_NAMES } from '../../../../lib/queue/client';

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
const leadImportQueue = createQueue(QUEUE_NAMES.ICP_LEAD_IMPORT);

const csvRowSchema = z.object({
  name: z.string().max(255).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  company: z.string().max(255).optional(),
  job_title: z.string().max(255).optional(),
  industry: z.string().max(255).optional(),
  company_size: z.string().max(100).optional(),
  revenue: z.string().max(100).optional(),
  geography: z.string().max(255).optional(),
  technology: z.string().max(1000).optional(),
  source: z.string().max(255).optional()
});

import { createApiClient } from '../../../../lib/supabase/server';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_leads_get', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabaseServer = createApiClient(req);
    const user = { id: userId };

    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');
    if (!organizationId) return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });

    await requireOrganizationMember(supabaseServer, userId, organizationId);

    const { data, error } = await supabaseServer.from('leads').select('*').eq('organization_id', organizationId).limit(50);
    if (error) throw new Error(error.message);

    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_leads_post', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
    }

    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Payload Too Large' }, { status: 413 });
    }

    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabaseServer = createApiClient(req);
    const user = { id: userId };
    
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const requestSchema = z.object({
      organizationId: z.string().uuid(),
      projectId: z.string().uuid().optional(),
      icpProfileId: z.string().uuid().optional(),
      rows: z.array(z.any()).min(1).max(5000)
    });

    const parsedBody = requestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Validation Error', details: parsedBody.error.issues }, { status: 400 });
    }

    const { organizationId, projectId, icpProfileId, rows } = parsedBody.data;
    if (typeof projectId !== 'undefined') await requireProjectOwnership(supabaseServer, projectId, organizationId);
    
    // Validate rows
    const validRows = [];
    const errors = [];
    
    for (let i = 0; i < rows.length; i++) {
      const parsed = csvRowSchema.safeParse(rows[i]);
      if (parsed.success) {
        validRows.push(parsed.data);
      } else {
        errors.push({ row: i, error: parsed.error.issues });
      }
    }
    
    if (validRows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in CSV', details: errors }, { status: 400 });
    }
    
    // Enqueue bulk import job
    const job = await leadImportQueue.add('bulk-import', {
      organizationId,
      projectId,
      icpProfileId,
      rows: validRows
    }, {
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
    
    return NextResponse.json({
      success: true,
      message: `Enqueued ${validRows.length} leads for import`,
      jobId: job.id,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
