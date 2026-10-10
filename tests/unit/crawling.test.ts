import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPrivateIP, resolveAndValidateURL, ValidationError } from '../../src/lib/crawling/validator';
import { safeFetch, FetchError } from '../../src/lib/crawling/fetcher';
import { crawlWorker } from '../../src/lib/queue/crawl-worker';
import dns from 'dns';
import https from 'https';
import http from 'http';
import { EventEmitter } from 'events';

// Mock DNS
vi.mock('dns', () => {
  const resolve4 = vi.fn();
  const resolve6 = vi.fn();
  return {
    default: { resolve4, resolve6 },
    resolve4,
    resolve6
  };
});

// Mock HTTP/HTTPS
const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));
vi.mock('https', () => ({
  default: { request: mockRequest },
  request: mockRequest
}));
vi.mock('http', () => ({
  default: { request: mockRequest },
  request: mockRequest
}));

vi.mock('../../src/lib/provenance/tracker', () => ({
  logDataProvenance: vi.fn().mockResolvedValue(undefined)
}));

describe('Secure Crawling Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Validation & SSRF Protection', () => {
    it('should reject localhost / 127.0.0.1', () => {
      expect(isPrivateIP('127.0.0.1')).toBe(true);
      expect(isPrivateIP('127.0.1.5')).toBe(true);
    });

    it('should reject IPv6 loopback', () => {
      expect(isPrivateIP('::1')).toBe(true);
    });

    it('should reject private IP ranges', () => {
      expect(isPrivateIP('10.0.0.5')).toBe(true);
      expect(isPrivateIP('172.16.0.1')).toBe(true);
      expect(isPrivateIP('192.168.1.1')).toBe(true);
    });

    it('should reject cloud metadata endpoint 169.254.169.254', () => {
      expect(isPrivateIP('169.254.169.254')).toBe(true);
    });

    it('should reject invalid protocols', async () => {
      await expect(resolveAndValidateURL('ftp://example.com')).rejects.toThrow(ValidationError);
      await expect(resolveAndValidateURL('file:///etc/passwd')).rejects.toThrow(ValidationError);
    });

    it('should prevent DNS rebinding by rejecting if DNS resolves to private IP', async () => {
      // @ts-expect-error Mocking module
      (dns.resolve4).mockImplementation((hostname: string, cb: (err: Error | null, addresses: string[]) => void) => cb(null, ['10.0.0.1']));
      await expect(resolveAndValidateURL('http://rebinder.com')).rejects.toThrow('DNS resolved to a private IP');
    });

    it('should pass valid public IPs', async () => {
      // @ts-expect-error Mocking module
      (dns.resolve4).mockImplementation((hostname: string, cb: (err: Error | null, addresses: string[]) => void) => cb(null, ['93.184.216.34']));
      const ip = await resolveAndValidateURL('http://example.com');
      expect(ip).toBe('93.184.216.34');
    });
  });

  describe('Resource Limits & Safe Fetching', () => {
    
    it('enforces redirect limit', async () => {
      // Mock DNS
      // @ts-expect-error Mocking module
      (dns.resolve4).mockImplementation((hostname: string, cb: (err: Error | null, addresses: string[]) => void) => cb(null, ['93.184.216.34']));

      // Mock request to always redirect
      mockRequest.mockImplementation((options: unknown, cb: (res: EventEmitter) => void) => {
        const res = new EventEmitter() as EventEmitter & { statusCode?: number; headers?: Record<string, string> };
        res.statusCode = 301;
        res.headers = { location: 'https://example.com/redirect' };
        
        const req = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void };
        req.end = vi.fn(() => cb(res));
        req.destroy = vi.fn();
        return req;
      });

      await expect(safeFetch('https://example.com', { maxRedirects: 2 })).rejects.toThrow('Too many redirects');
    });

    it('rejects invalid Content-Type', async () => {
      // @ts-expect-error Mocking module
      (dns.resolve4).mockImplementation((hostname: string, cb: (err: Error | null, addresses: string[]) => void) => cb(null, ['93.184.216.34']));
      mockRequest.mockImplementation((options: unknown, cb: (res: EventEmitter) => void) => {
        const res = new EventEmitter() as EventEmitter & { statusCode?: number; headers?: Record<string, string> };
        res.statusCode = 200;
        res.headers = { 'content-type': 'application/x-executable' };
        const req = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void };
        req.end = vi.fn(() => cb(res));
        req.destroy = vi.fn();
        return req;
      });

      await expect(safeFetch('https://example.com')).rejects.toThrow('Unsupported Content-Type');
    });
    
    it('rejects large response bodies', async () => {
      // @ts-expect-error Mocking module
      (dns.resolve4).mockImplementation((hostname: string, cb: (err: Error | null, addresses: string[]) => void) => cb(null, ['93.184.216.34']));
      mockRequest.mockImplementation((options: unknown, cb: (res: EventEmitter) => void) => {
        const res = new EventEmitter() as EventEmitter & { statusCode?: number; headers?: Record<string, string> };
        res.statusCode = 200;
        res.headers = { 'content-type': 'text/html' };
        const req = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void };
        req.end = vi.fn(() => {
          cb(res);
          res.emit('data', Buffer.alloc(6000000)); // 6MB
        });
        req.destroy = vi.fn();
        return req;
      });

      await expect(safeFetch('https://example.com', { maxResponseSize: 5000000 })).rejects.toThrow('Response size exceeded limit');
    });
    
    it('sanitizes successful HTML responses', async () => {
      // @ts-expect-error Mocking module
      (dns.resolve4).mockImplementation((hostname: string, cb: (err: Error | null, addresses: string[]) => void) => cb(null, ['93.184.216.34']));
      mockRequest.mockImplementation((options: unknown, cb: (res: EventEmitter) => void) => {
        const res = new EventEmitter() as EventEmitter & { statusCode?: number; headers?: Record<string, string> };
        res.statusCode = 200;
        res.headers = { 'content-type': 'text/html' };
        const req = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void };
        req.end = vi.fn(() => {
          cb(res);
          res.emit('data', Buffer.from('<h1>Hello</h1><script>alert(1)</script>'));
          res.emit('end');
        });
        req.destroy = vi.fn();
        return req;
      });

      const result = await safeFetch('https://example.com');
      expect(result.content).toBe('<h1>Hello</h1>');
      expect(result.content).not.toContain('<script>');
    });
  });
});
