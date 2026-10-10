import { createAdminClient } from '../supabase/admin';

export interface Advertisement {
  id?: string;
  organization_id: string;
  project_id: string;
  external_ad_id: string;
  platform: 'meta' | 'google' | 'linkedin' | 'tiktok';
  advertiser_name: string;
  creative_type?: string;
  created_at?: string;
  page_id?: string;
  ad_text?: string | null;
  headline?: string | null;
  cta_text?: string | null;
  media_urls?: string[];
  destination_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  source_url?: string;
  creative_hash?: string;
  raw_source_metadata?: Record<string, unknown>;
}

export interface AdvertisementObservation {
  id?: string;
  advertisement_id: string;
  observation_date: string;
  status: 'active' | 'inactive';
  metrics?: Record<string, unknown>;
}

export async function upsertAdvertisement(ad: Advertisement) {
  const supabase = createAdminClient();
  
  let existingAd = null;

  if (ad.external_ad_id) {
    const { data } = await supabase
      .from('advertisements')
      .select('id')
      .eq('external_ad_id', ad.external_ad_id)
      .eq('platform', ad.platform)
      .eq('organization_id', ad.organization_id)
      .single();
    existingAd = data;
  } else if (ad.creative_hash) {
    const { data } = await supabase
      .from('advertisements')
      .select('id')
      .eq('creative_hash', ad.creative_hash)
      .eq('platform', ad.platform)
      .eq('organization_id', ad.organization_id)
      .single();
    existingAd = data;
  }

  if (existingAd) {
    // We could optionally update it here, but instruction says return ID if duplicate
    return existingAd.id;
  }

  const { data: newAd, error } = await supabase
    .from('advertisements')
    .insert(ad)
    .select('id')
    .single();
    
  if (error) throw new Error(`Failed to upsert ad: ${error.message}`);
  return newAd.id;
}

export async function recordObservation(observation: AdvertisementObservation) {
  const supabase = createAdminClient();
  
  // Historical preservation: we ALWAYS insert new observations instead of overwriting
  const { error } = await supabase
    .from('advertisement_observations')
    .insert(observation);

  if (error) throw new Error(`Failed to record observation: ${error.message}`);
}
