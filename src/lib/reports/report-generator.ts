import { n8n } from '../n8n/n8n-client';
import { resend } from '../notifications/resend-client';
import { logger } from '../observability/logger';

export async function generateAndDistributeReport(organizationId: string, projectId: string, userEmail: string) {
  try {
    logger.info(`Initiating report generation for Project ${projectId}`);
    
    const reportData = {
      projectId,
      timestamp: new Date().toISOString(),
      // Mock data that would normally be aggregated from PostgreSQL and Valkey
      insights: [
        "Competitor A increased spend by 20%",
        "Creative Fatigue detected on 3 active ads"
      ]
    };

    // 1. Offload heavy PDF/recurring report generation to n8n (as defined by blueprint)
    await n8n.deliverReport(organizationId, reportData);

    // 2. Notify the user immediately that the report is compiling
    await resend.sendEmail(
      userEmail,
      'AdIntelix Report Generating',
      '<p>Your report is currently being processed. You will receive another notification when it is ready.</p>'
    );

    return { status: 'processing' };
  } catch (error) {
    logger.error(error as Error, { context: 'report-generator' });
    throw error;
  }
}
