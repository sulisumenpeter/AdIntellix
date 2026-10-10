export interface NormalizedAdData {
  external_ad_id: string;
  platform: string;
  advertiser_name: string;
  page_id: string;
  ad_text: string | null;
  headline: string | null;
  cta_text: string | null;
  media_urls: string[];
  destination_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  source_url: string;
  creative_hash: string | null;
  raw_source_metadata: Record<string, unknown>;
}

export class ApifyAdapterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApifyAdapterError';
  }
}

export interface ApifyAdapterConfig {
  apiToken?: string; // Fallback to process.env.APIFY_API_TOKEN
  maxRetries?: number;
  timeoutMs?: number;
}

export class ApifyAdapter {
  private apiToken: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(config?: ApifyAdapterConfig) {
    const token = config?.apiToken || process.env.APIFY_API_TOKEN;
    if (!token) {
      throw new Error('APIFY_API_TOKEN is required');
    }
    this.apiToken = token;
    this.maxRetries = config?.maxRetries ?? 3;
    this.timeoutMs = config?.timeoutMs ?? 30000;
  }

  /**
   * Internal fetch wrapper with timeout, retries, and rate limiting
   */
  private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    let attempt = 0;
    
    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
      
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        // Rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
          console.warn(`[ApifyAdapter] Rate limited. Retrying after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        // Other server errors (5xx)
        if (response.status >= 500) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[ApifyAdapter] Server error ${response.status}. Retrying after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        // Client errors (4xx other than 429) shouldn't be retried
        throw new ApifyAdapterError(`Apify API Error: ${response.statusText}`, response.status, false);

      } catch (error: unknown) {
        clearTimeout(timeoutId);
        
        const err = error as Error;
        if (err.name === 'AbortError') {
          console.warn(`[ApifyAdapter] Request timeout on attempt ${attempt}`);
        } else {
          console.warn(`[ApifyAdapter] Network error on attempt ${attempt}: ${err.message}`);
        }

        if (attempt >= this.maxRetries) {
          throw new ApifyAdapterError(`Failed after ${this.maxRetries} retries: ${err.message}`, undefined, false);
        }

        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
    
    throw new ApifyAdapterError('Unexpected retry loop exit', undefined, false);
  }

  /**
   * Starts an actor run and waits for it to finish, returning normalized results.
   */
  async runFacebookAdsLibraryActor(searchUrl: string, resultsLimit: number = 10): Promise<NormalizedAdData[]> {
    const actorId = 'automation-lab~facebook-ads-library';
    
    console.log(`[ApifyAdapter] Starting scrape for URL: ${searchUrl}`);
    
    // We use the run-sync-get-dataset-items endpoint for convenience,
    // which starts the run, waits, and returns the dataset.
    // If it takes longer than 120s it might time out the request, 
    // but we have fetchWithRetry which can handle transient issues.
    // For a fully robust production system over 2 mins, we would poll.
    // Here we'll use a standard run start and poll.
    
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs`;
    
    const input = {
      enrichWithEcommerceData: false,
      includeAboutPage: false,
      isDetailsPerAd: false,
      onlyTotal: false,
      resultsLimit,
      startUrls: [{ url: searchUrl }]
    };

    // 1. Start run
    const runRes = await this.fetchWithRetry(runUrl, {
      method: 'POST',
      body: JSON.stringify(input)
    });
    
    const runData = await runRes.json();
    const runId = runData.data.id;
    const datasetId = runData.data.defaultDatasetId;
    
    console.log(`[ApifyAdapter] Started run ${runId}, dataset ${datasetId}`);

    // 2. Poll for completion
    let isFinished = false;
    const pollUrl = `https://api.apify.com/v2/actor-runs/${runId}`;
    
    while (!isFinished) {
      // wait 5 seconds between polls
      await new Promise(r => setTimeout(r, 5000));
      
      const pollRes = await this.fetchWithRetry(pollUrl, { method: 'GET' });
      const pollData = await pollRes.json();
      const status = pollData.data.status;
      
      if (status === 'SUCCEEDED') {
        isFinished = true;
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new ApifyAdapterError(`Apify run failed with status: ${status}`);
      }
    }
    
    // 3. Fetch dataset
    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items`;
    const dataRes = await this.fetchWithRetry(datasetUrl, { method: 'GET' });
    const items = await dataRes.json();
    
    if (!Array.isArray(items)) {
       throw new ApifyAdapterError('Unexpected dataset format returned');
    }
    
    return items.map(item => this.normalizeData(item));
  }

  /**
   * Normalizes raw Apify data from automation-lab/facebook-ads-library to AdIntelix contract.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  normalizeData(rawData: any): NormalizedAdData {
    // Extract ID from adLibraryUrl if possible
    let extractedId = rawData.id || rawData.adId || '';
    const sourceUrl = rawData.adLibraryUrl || rawData.url || '';
    
    if (!extractedId && sourceUrl) {
      try {
        const urlObj = new URL(sourceUrl);
        extractedId = urlObj.searchParams.get('id') || '';
      } catch (e) {
        // invalid URL, ignore
      }
    }
    
    return {
      external_ad_id: extractedId,
      platform: 'meta',
      advertiser_name: rawData.advertiserPageName || rawData.pageName || '',
      page_id: rawData.pageId || '',
      ad_text: rawData.adCopybodyText || rawData.text || null,
      headline: rawData.headlineTitle || null,
      cta_text: rawData.cta || null,
      media_urls: rawData.mediaUrls || rawData.images || [],
      destination_url: rawData.destinationUrllinkUrl || rawData.link || null,
      start_date: rawData.startDatestartDate || rawData.startDate || null,
      end_date: rawData.endDateendDate || rawData.endDate || null,
      is_active: rawData.activeisActive !== false && rawData.isActive !== false,
      source_url: sourceUrl,
      creative_hash: null, // Will be computed in the worker
      raw_source_metadata: rawData
    };
  }
}
