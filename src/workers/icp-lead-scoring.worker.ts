import { logger } from '../lib/observability/logger';
import { z } from 'zod';
import { Lead, IcpRule, LeadScore } from '../lib/models/icp';
import { createClient } from '@supabase/supabase-js';
import { env } from '../lib/env';

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

export const IcpLeadScoringJobSchema = z.object({ leadId: z.string().uuid(), icpProfileId: z.string().uuid(), organizationId: z.string().uuid(), projectId: z.string().uuid() });

export async function processLeadScoring(jobId: string, rawData: unknown) {
  const parseResult = IcpLeadScoringJobSchema.safeParse(rawData);
  if (!parseResult.success) throw new Error('Invalid job payload');
  const data = parseResult.data;
  try {
    const { leadId, icpProfileId, organizationId, projectId } = data;
    
    // 1. Fetch Lead and Rules
    const { data: profile, error: profileErr } = await supabase
      .from('icp_profiles')
      .select('id')
      .eq('id', icpProfileId)
      .eq('organization_id', organizationId)
      .single();
    if (profileErr || !profile) throw new Error('ICP Profile not found or unauthorized');

    const { data: leadData, error: leadErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('organization_id', organizationId)
      .single();
      
    if (leadErr || !leadData) throw new Error(`Lead not found: ${leadErr?.message}`);
    
    const { data: rulesData, error: rulesErr } = await supabase
      .from('icp_rules')
      .select('*')
      .eq('icp_profile_id', icpProfileId);
      
    if (rulesErr) throw new Error(`Rules not found: ${rulesErr.message}`);
    
    const lead = leadData as Lead;
    const rules = rulesData as IcpRule[];
    
    // 2. Deterministic Scoring Logic
    let totalScore = 0;
    let maxPossibleScore = 0;
    const matchedCriteria: Record<string, unknown>[] = [];
    const failedCriteria: Record<string, unknown>[] = [];
    const scoreBreakdown: Record<string, number> = {};
    
    if (rules.length === 0) {
      // If no rules, default to 0
    } else {
      for (const rule of rules) {
        maxPossibleScore += rule.weight;
        const fieldName = rule.rule_type; // e.g., 'industry', 'company_size'
        const leadValue = (lead as unknown as Record<string, unknown>)[fieldName] || '';
        let matched = false;
        
        switch (rule.operator) {
          case 'equals':
            matched = String(leadValue).toLowerCase() === String(rule.value).toLowerCase();
            break;
          case 'contains':
            matched = String(leadValue).toLowerCase().includes(String(rule.value).toLowerCase());
            break;
          case 'regex':
            try {
              const regex = new RegExp(rule.value, 'i');
              matched = regex.test(String(leadValue));
            } catch (e) {
              matched = false;
            }
            break;
          // Add more operators as needed
          default:
            matched = false;
        }
        
        if (matched) {
          totalScore += rule.weight;
          scoreBreakdown[rule.id] = rule.weight;
          matchedCriteria.push({ rule_id: rule.id, field: fieldName, value: leadValue });
        } else {
          scoreBreakdown[rule.id] = 0;
          failedCriteria.push({ rule_id: rule.id, field: fieldName, value: leadValue });
        }
      }
    }
    
    // 3. Normalize score to 0-100
    const normalizedScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    // 4. Qualification status
    let status = 'poor fit';
    if (normalizedScore >= 80) status = 'excellent fit';
    else if (normalizedScore >= 60) status = 'good fit';
    else if (normalizedScore >= 40) status = 'moderate fit';
    
    // 5. Store result
    const { error: upsertErr } = await supabase
      .from('lead_scores')
      .insert({
        lead_id: leadId,
        icp_profile_id: icpProfileId,
        overall_score: normalizedScore,
        qualification_status: status,
        matched_criteria: matchedCriteria,
        failed_criteria: failedCriteria,
        score_breakdown: scoreBreakdown,
        scored_at: new Date().toISOString()
      });
      
    if (upsertErr) throw new Error(`Failed to save score: ${upsertErr.message}`);
    
    logger.info(`Lead scoring completed for lead ${leadId} with score ${normalizedScore}`);
    return { success: true, score: normalizedScore, status };
  } catch (error) {
    logger.error('Lead scoring failed', { error, jobId });
    throw error;
  }
}
