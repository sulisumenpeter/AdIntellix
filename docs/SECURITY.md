# Security

- **Authentication & Authorization**: Supabase Auth and strict PostgreSQL RLS.
- **Secret management**: No secrets in source code, use Vercel/Blitz Cloud environment variables.
- **API validation**: Strict input validation on all routes.
- **Rate limiting**: Enforced via Valkey.
- **Idempotency**: Required for mutations and webhooks.
- **Webhook security**: Signature verification for Paddle and n8n.
- **Crawler protections**: Block localhost, 127.0.0.1, IPv6 loopback, private IP ranges, link-local addresses, cloud metadata endpoints, internal network targets. Only HTTP/HTTPS is permitted.
- **Other crawler rules**: SSRF prevention, DNS rebinding prevention, Redirect validation, Request size limits, Request timeouts, Content-type restrictions, Redirect limits.
