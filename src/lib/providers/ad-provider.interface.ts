import { RawAdPayload } from '../intelligence/competitor-ad';

export interface AdFetchOptions {
  organizationId: string;
  projectId: string;
  limit?: number;
  since?: string;
}

export interface AdProvider {
  /**
   * The canonical name of the provider (e.g., 'meta', 'google')
   */
  name: 'meta' | 'google';

  /**
   * Validates that the provider has the necessary credentials and access
   */
  verifyAccess(organizationId: string): Promise<boolean>;

  /**
   * Fetches advertisements from the provider
   */
  fetchAds(query: string, options: AdFetchOptions): Promise<RawAdPayload[]>;
}
