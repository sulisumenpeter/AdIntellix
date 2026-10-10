import * as dns from 'dns';
import { promisify } from 'util';
import net from 'net';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function isPrivateIP(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0/8
    if (parts[0] === 127) return true;
    // 169.254.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    return false;
  }
  
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    // Loopback
    if (lower === '::1') return true;
    // Link-local
    if (lower.startsWith('fe80:')) return true;
    // Unique local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // IPv4 mapped
    if (lower.startsWith('::ffff:')) {
      const v4Part = lower.split(':').pop();
      if (v4Part && net.isIPv4(v4Part)) return isPrivateIP(v4Part);
    }
    return false;
  }
  
  return false;
}

export async function resolveAndValidateURL(urlString: string): Promise<string> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch (err) {
    throw new ValidationError('Invalid URL format');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new ValidationError('Only HTTP and HTTPS protocols are allowed');
  }

  const hostname = parsedUrl.hostname;
  
  // Quick check on hostname if it's directly an IP
  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new ValidationError('Private IPs are not allowed');
    }
    return hostname;
  }

  // Resolve DNS
  let ips: string[] = [];
  try {
    const addresses = await resolve4(hostname);
    ips = addresses;
  } catch (err: unknown) {
    if (err instanceof Error && (err as Error & { code?: string }).code !== 'ENODATA' && (err as Error & { code?: string }).code !== 'ENOTFOUND') {
      throw new ValidationError('DNS resolution failed');
    }
  }

  if (ips.length === 0) {
    try {
      const addresses6 = await resolve6(hostname);
      ips = addresses6;
    } catch (err: unknown) {
      // Ignore
    }
  }

  if (ips.length === 0) {
    throw new ValidationError('DNS resolution failed: No IP found');
  }

  // Validate all resolved IPs to prevent DNS rebinding mapping some to private
  for (const ip of ips) {
    if (isPrivateIP(ip)) {
      throw new ValidationError('DNS resolved to a private IP');
    }
  }

  return ips[0];
}
