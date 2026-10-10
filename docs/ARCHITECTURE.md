# Architecture

## Frontend/API
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vercel

## Database
- PostgreSQL via Supabase

## Authentication
- Supabase Auth

## Database authorization
- PostgreSQL RLS

## Storage
- Supabase Storage

## Queue/cache
- Layerbase
- Valkey 8.0
- Database name: adintelix

## Workers
- Docker
- Blitz Cloud

## Workflow automation
- Self-hosted n8n Community Edition
- Blitz Cloud
- https://n8n.marksman.blitz.cloud

## AI
- Internal AI Gateway
- Gemini (primary for development/cost efficiency)
- Claude

## Billing
- Paddle
- Paddle Checkout
- Paddle Merchant of Record

## Monitoring
- Sentry
- PostHog

## Email
- Resend

## Source control
- GitHub

## Explicitly REMOVED
- Stripe
- Railway
- Oracle Cloud
- Upstash

## Responsibility Boundaries
**Application Code Owns:** Product logic, Business logic, Authorization decisions, Tenant logic, Data validation, Core scoring, Billing entitlement enforcement, Core intelligence calculations.
**Supabase Owns:** PostgreSQL, Authentication, Storage, Database RLS.
**Valkey Owns:** Cache, Rate limiting, Queue/coordination where appropriate.
**n8n Owns:** Scheduled workflows, External integrations, Webhooks, Notifications, Report delivery, CRM/API synchronization, Recurring intelligence collection.
**n8n MUST NOT Own:** Authentication, Tenant isolation, Core business logic, Billing enforcement, Database integrity, Core scoring rules.
**Workers Own:** Heavy processing, Large-scale ad ingestion, Batch AI analysis, Large reports, Heavy crawling, Long-running processing.
**AI Gateway Owns:** Model abstraction, Provider routing, AI governance, Cost controls, Prompt versioning, Structured output validation, AI usage logging.
**Paddle Owns:** Checkout, Payment processing, Subscription billing, Global tax/Merchant-of-Record responsibilities. (Database remains source of truth for entitlements).
