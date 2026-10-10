import { logger } from '../lib/observability/logger';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import { env } from '../lib/env';

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

export const IcpReportGenJobSchema = z.object({
  reportRunId: z.string().uuid(),
  organizationId: z.string().uuid(),
  projectId: z.string().uuid()
});

export async function processReportGeneration(jobId: string, rawData: unknown) {
  try {
    const parseResult = IcpReportGenJobSchema.safeParse(rawData);
    if (!parseResult.success) throw new Error('Invalid job payload');
    const data = parseResult.data;
    const { reportRunId, organizationId, projectId } = data;
    
    // 1. Fetch Report Metadata and Verify Ownership
    const { data: reportData, error: reportErr } = await supabase
      .from('report_runs')
      .select('*')
      .eq('id', reportRunId)
      .eq('organization_id', organizationId)
      .single();
      
    if (reportErr || !reportData) throw new Error(`Report not found or unauthorized: ${reportErr?.message}`);

    // Idempotency check
    if (reportData.status === 'completed') {
      logger.info(`Report ${reportRunId} already completed, skipping`);
      return { success: true, status: 'skipped' };
    }
    
    // 2. Fetch Lead Scores and aggregate
    const { data: scoresData, error: scoresErr } = await supabase
      .from('lead_scores')
      .select(`
        overall_score,
        qualification_status,
        failed_criteria,
        matched_criteria,
        leads!inner(id, organization_id, project_id, company, source)
      `)
      .eq('leads.organization_id', organizationId)
      .eq('leads.project_id', projectId);
      
    if (scoresErr) throw new Error(`Scores not found: ${scoresErr.message}`);
    
    const scores = scoresData || [];
    
    const totalLeads = scores.length;
    let sumScore = 0;
    let qualifiedLeads = 0;
    
    // basic aggregation
    scores.forEach((s: Record<string, unknown>) => {
      sumScore += Number(s.overall_score) || 0;
      if (['excellent fit', 'good fit'].includes(String(s.qualification_status))) {
        qualifiedLeads++;
      }
    });
    
    const averageScore = totalLeads > 0 ? Math.round(sumScore / totalLeads) : 0;
    
    const aggregatedData = {
      totalLeads,
      scoredLeads: totalLeads,
      averageScore,
      qualifiedLeads,
      scoreDistribution: {
        'excellent fit': scores.filter((s: Record<string, unknown>) => String(s.qualification_status) === 'excellent fit').length,
        'good fit': scores.filter((s: Record<string, unknown>) => String(s.qualification_status) === 'good fit').length,
        'moderate fit': scores.filter((s: Record<string, unknown>) => String(s.qualification_status) === 'moderate fit').length,
        'poor fit': scores.filter((s: Record<string, unknown>) => String(s.qualification_status) === 'poor fit').length,
      }
    };
    
    let csv_export = null;
    let pdf_export_base64 = null;

    if (reportData.report_type === 'csv') {
      const csvHeader = 'Name,Company,Job Title,Score,Status\n';
      const csvRows = scores.map((s: Record<string, unknown>) => {
        const l = s.leads as unknown as Record<string, unknown>;
        return `${l?.name || ''},${l?.company || ''},${l?.job_title || ''},${s.overall_score || 0},${s.qualification_status}`;
      }).join('\n');
      csv_export = csvHeader + csvRows;
    }

    if (reportData.report_type === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('AdIntelix ICP Report', 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Project ID: ${projectId}`, 14, 32);
      doc.text(`Total Leads: ${totalLeads}`, 14, 40);
      doc.text(`Average Score: ${averageScore}`, 14, 48);
      
      doc.setFontSize(14);
      doc.text('Qualification Distribution:', 14, 60);
      doc.setFontSize(11);
      
      const dist = aggregatedData.scoreDistribution as Record<string, number>;
      doc.text(`Excellent Fit: ${dist['excellent fit'] || 0}`, 14, 70);
      doc.text(`Good Fit: ${dist['good fit'] || 0}`, 14, 78);
      doc.text(`Moderate Fit: ${dist['moderate fit'] || 0}`, 14, 86);
      doc.text(`Poor Fit: ${dist['poor fit'] || 0}`, 14, 94);
      
      doc.text(`Generated: ${new Date().toISOString()}`, 14, 110);
      
      // Save as base64 data uri for the database
      pdf_export_base64 = doc.output('datauristring');
    }
    
    // 3. Mark report as completed
    const { error: updateErr } = await supabase
      .from('report_runs')
      .update({
        status: 'completed',
        data: { ...aggregatedData, csv_export, pdf_export_base64 },
        updated_at: new Date().toISOString()
      })
      .eq('id', reportRunId);
      
    if (updateErr) throw new Error(`Failed to update report: ${updateErr.message}`);
    
    logger.info(`Report generation completed for report ${reportRunId}`);
    return { success: true };
  } catch (error) {
    logger.error('Report generation failed', { error, jobId });
    throw error;
  }
}
