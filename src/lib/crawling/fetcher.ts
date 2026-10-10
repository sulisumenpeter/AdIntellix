import http from 'http';
import https from 'https';
import { URL } from 'url';
import { resolveAndValidateURL, ValidationError } from './validator';
import sanitizeHtml from 'sanitize-html';

export interface FetchOptions {
  maxRedirects?: number;
  maxResponseSize?: number;
  timeoutMs?: number;
}

export interface CrawlResult {
  url: string;
  contentType: string;
  content: string;
}

export class FetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FetchError';
  }
}

export async function safeFetch(urlString: string, options: FetchOptions = {}, redirectCount = 0): Promise<CrawlResult> {
  const maxRedirects = options.maxRedirects ?? 5;
  const maxResponseSize = options.maxResponseSize ?? 5 * 1024 * 1024; // 5MB
  const timeoutMs = options.timeoutMs ?? 10000;

  if (redirectCount > maxRedirects) {
    throw new FetchError('Too many redirects');
  }

  // 1. DNS Resolution and Validation
  const validatedIp = await resolveAndValidateURL(urlString);

  const parsedUrl = new URL(urlString);
  const isHttps = parsedUrl.protocol === 'https:';
  const requestFn = isHttps ? https.request : http.request;

  return new Promise((resolve, reject) => {
    // We enforce DNS rebinding protection by providing a custom lookup
    // that only returns the validated IP we already checked.
    const reqOptions: http.RequestOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      lookup: (hostname, options, callback) => {
        // Return the validated IP directly
        callback(null, validatedIp, parsedUrl.hostname.includes(':') ? 6 : 4);
      },
      timeout: timeoutMs
    };

    const req = requestFn(reqOptions, (res) => {
      // 2. Redirect Validation
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirect
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, urlString).toString();
        }
        
        req.destroy();
        safeFetch(redirectUrl, options, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (res.statusCode && res.statusCode >= 400) {
        req.destroy();
        return reject(new FetchError(`HTTP Error: ${res.statusCode}`));
      }

      // 3. Content-Type Validation
      const contentType = res.headers['content-type'] || 'text/plain';
      if (!contentType.includes('text/html') && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
        req.destroy();
        return reject(new FetchError(`Unsupported Content-Type: ${contentType}`));
      }

      let size = 0;
      const chunks: Buffer[] = [];

      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxResponseSize) {
          req.destroy();
          reject(new FetchError('Response size exceeded limit'));
        } else {
          chunks.push(chunk);
        }
      });

      res.on('end', () => {
        const rawContent = Buffer.concat(chunks).toString('utf-8');
        
        // 4. Sanitize HTML
        const cleanContent = sanitizeHtml(rawContent, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
          allowedAttributes: false // Allow all for structural extraction, but we sanitize scripts
        });

        resolve({
          url: urlString,
          contentType,
          content: cleanContent
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new FetchError('Request timeout'));
    });

    req.on('error', (err) => {
      reject(new FetchError(`Request failed: ${err.message}`));
    });

    req.end();
  });
}
