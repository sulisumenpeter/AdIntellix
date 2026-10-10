import { env } from '../env';
import { logger } from '../observability/logger';

// Simplified Resend abstraction
export class ResendClient {
  private apiKey: string;
  
  constructor() {
    this.apiKey = env.RESEND_API_KEY || '';
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!this.apiKey) {
      logger.warn('Resend API key missing, skipping email transmission');
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'AdIntelix <notifications@adintelix.com>',
          to,
          subject,
          html
        })
      });

      if (!response.ok) {
        throw new Error(`Resend API returned ${response.status}`);
      }

      logger.info(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      logger.error(error as Error, { context: 'resend-email' });
      return false;
    }
  }

  async sendReportReadyNotification(to: string, reportUrl: string) {
    await this.sendEmail(
      to,
      'Your AdIntelix Report is Ready',
      `<p>View your latest competitor intelligence report here: <a href="${reportUrl}">${reportUrl}</a></p>`
    );
  }
}

export const resend = new ResendClient();
