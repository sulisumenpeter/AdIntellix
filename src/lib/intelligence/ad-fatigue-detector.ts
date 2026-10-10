import { createAdminClient } from '../supabase/admin';
import { logger } from '../observability/logger';

export interface FatigueResult {
  fatigueScore: number;
  fatigueStatus: 'healthy' | 'warning' | 'fatigued';
  signalsDetected: string[];
  firstObservedDate: string;
  latestObservedDate: string;
  recommendation: string;
}

export async function detectAdFatigue(
  organizationId: string,
  advertisementId: string
): Promise<FatigueResult> {
  const supabase = createAdminClient();

  // Get ad details
  const { data: ad, error: adError } = await supabase
    .from('advertisements')
    .select('start_date, end_date, is_active, created_at')
    .eq('id', advertisementId)
    .eq('organization_id', organizationId)
    .single();

  if (adError || !ad) {
    throw new Error(`Failed to fetch advertisement: ${adError?.message}`);
  }

  // Get observations
  const { data: obs, error: obsError } = await supabase
    .from('advertisement_observations')
    .select('observation_date, status')
    .eq('advertisement_id', advertisementId)
    .order('observation_date', { ascending: true });

  if (obsError) {
    throw new Error(`Failed to fetch observations: ${obsError.message}`);
  }

  const signalsDetected: string[] = [];
  let score = 0;

  // Determine dates
  const firstDateStr = ad.start_date || (obs && obs.length > 0 ? obs[0].observation_date : ad.created_at);
  const latestDateStr = ad.end_date || (obs && obs.length > 0 ? obs[obs.length - 1].observation_date : new Date().toISOString());

  const firstObservedDate = new Date(firstDateStr);
  const latestObservedDate = new Date(latestDateStr);

  const ageInDays = Math.floor((latestObservedDate.getTime() - firstObservedDate.getTime()) / (1000 * 3600 * 24));
  
  if (ageInDays > 30) {
    signalsDetected.push(`Ad is relatively old (${ageInDays} days).`);
    score += Math.min(30, ageInDays); // max +30 to score
  }

  if (ageInDays > 90) {
    signalsDetected.push(`Ad has been running for a very long time (>90 days). High risk of creative fatigue.`);
    score += 40;
  }

  // Active duration analysis
  if (!ad.is_active) {
    signalsDetected.push(`Ad is currently inactive.`);
    // Inactive ad isn't necessarily "fatigued" currently hurting spend, but it could have been turned off due to fatigue
    score += 10;
  }

  // Check observation frequency/changes
  const activeObs = obs?.filter(o => o.status === 'active') || [];
  if (activeObs.length > 0 && ageInDays > 14) {
    const frequency = activeObs.length / ageInDays;
    if (frequency > 0.8) {
       signalsDetected.push(`Consistently active over the observed period.`);
    }
  }

  let fatigueStatus: 'healthy' | 'warning' | 'fatigued' = 'healthy';
  let recommendation = 'Creative is fresh or stable. Keep monitoring.';

  // Normalize score to 0-100
  score = Math.min(100, Math.max(0, score));

  if (score >= 70) {
    fatigueStatus = 'fatigued';
    recommendation = 'Creative is likely fatigued due to age. Consider launching fresh creative variations.';
  } else if (score >= 40) {
    fatigueStatus = 'warning';
    recommendation = 'Creative age is increasing. Prepare new creative concepts to prevent performance drop.';
  }

  return {
    fatigueScore: score,
    fatigueStatus,
    signalsDetected,
    firstObservedDate: firstObservedDate.toISOString().split('T')[0],
    latestObservedDate: latestObservedDate.toISOString().split('T')[0],
    recommendation
  };
}

export async function processFatigueDetection(
  organizationId: string,
  advertisementId: string
) {
  const result = await detectAdFatigue(organizationId, advertisementId);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('ad_fatigue_reports')
    .upsert({
      organization_id: organizationId,
      advertisement_id: advertisementId,
      fatigue_score: result.fatigueScore,
      fatigue_status: result.fatigueStatus,
      signals_detected: result.signalsDetected,
      first_observed_date: result.firstObservedDate,
      latest_observed_date: result.latestObservedDate,
      recommendation: result.recommendation
    }, { onConflict: 'advertisement_id' });

  if (error) {
    logger.error(`Failed to upsert ad_fatigue_reports: ${error.message}`);
    throw error;
  }

  return result;
}
