import { env } from '../env';
import { createAdminClient } from '../supabase/admin';
import crypto from 'crypto';
import { logger } from '../observability/logger';

export class PaddleClient {
  private apiKey: string;
  private environment: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = env.PADDLE_API_KEY || '';
    this.environment = env.PADDLE_ENVIRONMENT || 'sandbox';
    this.webhookSecret = env.PADDLE_WEBHOOK_SECRET || '';
  }

  /**
   * Verifies the Paddle webhook signature
   * In a real implementation, this parses the paddle-signature header 
   * (ts=xxx;h1=yyy) and hashes the payload to confirm authenticity.
   */
  verifySignature(signatureHeader: string, rawBody: string): boolean {
    if (!this.webhookSecret || !signatureHeader) return false;
    
    try {
      const parts = signatureHeader.split(';');
      const tsPart = parts.find(p => p.startsWith('ts='));
      const h1Part = parts.find(p => p.startsWith('h1='));
      
      if (!tsPart || !h1Part) return false;
      
      const ts = tsPart.split('=')[1];
      const signature = h1Part.split('=')[1];
      
      const signedPayload = `${ts}:${rawBody}`;
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(signedPayload);
      const expectedSignature = hmac.digest('hex');
      
      const a = Buffer.from(signature);
      const b = Buffer.from(expectedSignature);
      
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (e) {
      return false;
    }
  }

  /**
   * Processes an incoming verified event securely with idempotency
   */
  async processEvent(eventId: string, eventType: string, payload: Record<string, unknown>) {
    const supabase = createAdminClient();

    const customData = (payload.data as Record<string, unknown>)?.custom_data as Record<string, unknown> || {};
    const organizationId = customData.organization_id;
    const now = new Date().toISOString();
    const STALE_TIMEOUT_MS = 5 * 60 * 1000;

    // 1. Check existing event
    const { data: existingEvent } = await supabase
      .from('billing_events')
      .select('id, status, processing_started_at')
      .eq('paddle_event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      if (existingEvent.status === 'processed') {
        logger.info(`Idempotency caught duplicate/processed Paddle event: ${eventId}`);
        return; 
      }
      
      if (existingEvent.status === 'pending') {
        const startedAt = existingEvent.processing_started_at ? new Date(existingEvent.processing_started_at).getTime() : 0;
        if (startedAt > Date.now() - STALE_TIMEOUT_MS) {
          logger.info(`Idempotency caught concurrent processing Paddle event: ${eventId}`);
          return;
        }
      }

      // Claim it for retry/recovery
      let query = supabase.from('billing_events')
        .update({ status: 'pending', processing_started_at: now })
        .eq('paddle_event_id', eventId)
        .eq('status', existingEvent.status);

      if (existingEvent.processing_started_at) {
        query = query.eq('processing_started_at', existingEvent.processing_started_at);
      } else {
        query = query.is('processing_started_at', null);
      }

      const { data: claimed, error: updateError } = await query.select('id');
      if (updateError || !claimed || claimed.length === 0) {
        logger.info(`Concurrent claim prevented for Paddle event: ${eventId}`);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('billing_events').insert({
        paddle_event_id: eventId,
        event_type: eventType,
        payload: payload,
        organization_id: organizationId || null,
        status: 'pending',
        processing_started_at: now
      });

      if (insertError) {
        logger.info(`Idempotency caught concurrent insert Paddle event: ${eventId}`);
        return;
      }
    }

    try {
      // 2. Entitlement Enforcement (Update subscriptions table)
      if (eventType.startsWith('subscription.')) {
        const sub = payload.data as Record<string, unknown>;
        if (!organizationId) {
          logger.warn(`Subscription event ${eventId} missing organization_id in custom_data`);
        } else {
          await supabase
            .from('subscriptions')
            .upsert({
              paddle_subscription_id: sub.id,
              organization_id: organizationId,
              paddle_customer_id: sub.customer_id,
              status: sub.status,
              plan_id: (sub as { items?: { price?: { product_id: string } }[] }).items?.[0]?.price?.product_id || 'unknown',
              current_period_end: (sub as { current_billing_period?: { ends_at: string } }).current_billing_period?.ends_at,
              updated_at: new Date().toISOString()
            }, { onConflict: 'paddle_subscription_id' });
            
          logger.info(`Updated subscription entitlement for org ${organizationId} to ${sub.status}`);
        }
      }

      // 3. Mark processed
      await supabase.from('billing_events').update({ status: 'processed' }).eq('paddle_event_id', eventId);
    } catch (error) {
      // Mark failed
      await supabase.from('billing_events').update({ status: 'failed' }).eq('paddle_event_id', eventId);
      throw error;
    }
  }
}

export const paddle = new PaddleClient();
