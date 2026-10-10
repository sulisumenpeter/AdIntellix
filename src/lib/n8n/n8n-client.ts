import { env } from '../env';
import { logger } from '../observability/logger';

export class N8nClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Blueprint states n8n is self-hosted on Blitz Cloud
    this.baseUrl = env.N8N_BASE_URL || 'https://n8n.marksman.blitz.cloud';
    this.apiKey = env.N8N_API_KEY || '';
  }

  /**
   * Fire-and-forget webhook invocation. 
   * As per the blueprint, the Blitz free plan can sleep, 
   * so core functionality must NOT depend on synchronous n8n responses.
   */
  async triggerWorkflow(webhookId: string, payload: Record<string, unknown>): Promise<void> {
    const url = `${this.baseUrl}/webhook/${webhookId}`;

    try {
      logger.info(`Triggering n8n workflow: ${webhookId}`);
      
      // We don't await the final processing, just the HTTP transmission
      // to ensure the main app remains decoupled from n8n's sleep state.
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload),
        // Timeout relatively quickly so it doesn't hang the app if n8n is cold-starting
        signal: AbortSignal.timeout(5000)
      }).catch(err => {
        logger.warn(`n8n webhook ${webhookId} transmission failed (may be sleeping)`, { error: err.message });
      });
      
    } catch (error) {
      logger.error(error as Error, { context: 'n8n-trigger', webhookId });
    }
  }

  async syncCrm(organizationId: string, leadData: Record<string, unknown>) {
    await this.triggerWorkflow('crm-sync-webhook', { organizationId, leadData });
  }

  async deliverReport(organizationId: string, reportData: Record<string, unknown>) {
    await this.triggerWorkflow('report-delivery-webhook', { organizationId, reportData });
  }

  async scheduleIntelligenceCollection(organizationId: string, projectId: string, config: Record<string, unknown>) {
    await this.triggerWorkflow('intelligence-collection-webhook', { organizationId, projectId, config });
  }

  async triggerExternalIntegration(organizationId: string, integrationId: string, payload: Record<string, unknown>) {
    await this.triggerWorkflow(`external-api-${integrationId}-webhook`, { organizationId, payload });
  }

  async sendNotification(organizationId: string, userId: string, message: string, context: Record<string, unknown> = {}) {
    await this.triggerWorkflow('notification-webhook', { organizationId, userId, message, context });
  }
}

export const n8n = new N8nClient();
