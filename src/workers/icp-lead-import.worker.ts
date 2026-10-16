import { logger } from '../lib/observability/logger';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { env } from '../lib/env';
import { createQueue, QUEUE_NAMES } from '../lib/queue/client';

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

const leadScoringQueue = createQueue(QUEUE_NAMES.ICP_LEAD_SCORING);

export const IcpLeadImportJobSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  icpProfileId: z.string().uuid().optional(),
  rows: z.array(z.record(z.string(), z.unknown())).max(5000)
});

export async function processLeadImport(jobId: string, rawData: unknown) {
  try {
    const parseResult = IcpLeadImportJobSchema.safeParse(rawData);
    if (!parseResult.success) throw new Error('Invalid job payload');
    const data = parseResult.data;
    const { organizationId, projectId, icpProfileId, rows } = data;
    
    // Verify project belongs to organization
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .single();
    if (projErr || !project) throw new Error('Project not found or unauthorized');

    // Verify icp profile belongs to organization if provided
    if (icpProfileId) {
      const { data: profile, error: profErr } = await supabase
        .from('icp_profiles')
        .select('id')
        .eq('id', icpProfileId)
        .eq('organization_id', organizationId)
        .single();
      if (profErr || !profile) throw new Error('ICP Profile not found or unauthorized');
    }
    
    // Map rows to Lead entity
    const leadsToInsert = rows.map(row => ({
      organization_id: organizationId,
      project_id: projectId,
      icp_profile_id: icpProfileId || null,
      name: row.name || null,
      email: row.email || null,
      company: row.company || null,
      job_title: row.job_title || null,
      industry: row.industry || null,
      company_size: row.company_size || null,
      revenue: row.revenue || null,
      geography: row.geography || null,
      technology: row.technology || null,
      source: row.source || 'csv_import',
      raw_metadata: row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert into Supabase (idempotency can be added if a unique constraint exists, currently skipping on conflict if we had a unique email per project)
    const { data: insertedLeads, error: insertErr } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select('id');
      
    if (insertErr) {
      throw new Error(`Failed to insert leads: ${insertErr.message}`);
    }
    
    logger.info(`Successfully imported ${insertedLeads.length} leads in job ${jobId}`);
    
    // If an ICP profile was selected, automatically queue them for scoring
    if (icpProfileId && insertedLeads && insertedLeads.length > 0) {
      const scoringJobs = insertedLeads.map(lead => ({
        name: 'score-lead',
        data: {
          leadId: lead.id,
          icpProfileId,
          organizationId,
          projectId
        }
      }));
      
      try {
        await leadScoringQueue.addBulk(scoringJobs);
        logger.info(`Queued ${scoringJobs.length} leads for scoring`);
      } catch (err) {
        logger.warn('Failed to enqueue to leadScoringQueue:', { err });
      }

      // Also process scoring directly to guarantee lead_scores are created in dev/test/workerless setups
      const { processLeadScoring } = await import('./icp-lead-scoring.worker');
      for (const sj of scoringJobs) {
        try {
          await processLeadScoring(sj.data.leadId, sj.data);
        } catch (scoringErr) {
          logger.error('Direct scoring error:', { scoringErr });
        }
      }
    }
    
    return { success: true, count: insertedLeads.length };
  } catch (error) {
    logger.error('Lead import failed', { error, jobId });
    throw error;
  }
}
