import os

docs_dir = "C:/Users/JEFF_MARKSMAN/Desktop/AdIntellix/docs"
os.makedirs(docs_dir, exist_ok=True)

docs = {
    "PRD.md": """# Product Requirements Document
## Product Vision
AdIntelix is a premier marketing intelligence platform designed to automate repetitive marketing research and analysis. It empowers performance marketers, agencies, media buyers, growth teams, and e-commerce/SaaS companies to gain deterministic and AI-enhanced insights into competitor advertising strategies, creative fatigue, and lead quality. Target markets: US, UK, Canada, Australia.

## Target Users & Personas
- Performance Marketers
- Media Buyers
- Creative Strategists / Agencies
- Growth Leads (B2B/SaaS)

## Jobs-to-be-Done
- When I am planning a new campaign, I want to see what creatives my competitors are running long-term, so I can identify proven hooks and offers.
- When my ad performance drops, I want to check if the creative is fatigued, so I can decide whether to refresh the creative or change the audience.
- When reviewing search terms, I want to quickly identify wasted spend, so I can add negative keywords and improve ROI.
- When evaluating a new creative brief, I want to score it against historical data, so I can increase the probability of success before spending production budget.

## Core Features
1. Competitor Ad Intelligence
2. Ad Pattern Intelligence
3. Creative Brief Scorer
4. Ad Fatigue Detection
5. Ad-to-Landing-Page Match
6. Google Ads Search-Term Intelligence
7. ICP Lead Scoring

## Non-Functional Requirements
- Multi-tenancy: Strict data isolation between organizations via RLS.
- Performance: p95 latency for cached/common dashboard API queries < 1s.
- Security: RBAC, encrypted secrets, explicit authorization, mandatory backend auth.
- Reliability: Idempotent background jobs, retry mechanisms, rate limit handling.
- Observability: Comprehensive logging, cost tracking, APM.
""",

    "ARCHITECTURE.md": """# Architecture

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
""",

    "DATABASE.md": """# Database Schema

## Required Entities
- `organizations`
- `subscriptions`
- `billing_events`
- `users` (maps to `auth.users.id`, no custom password hashing)
- `organization_members`
- `projects`
- `advertisements`
- `advertisement_observations`
- `data_provenance_logs`
- `ai_usage_logs`
- `landing_pages`

IMPLEMENTATION DECISION REQUIRED: Exact column definitions (data types, lengths) for some of the sub-entities.

## Principles
- Primary keys: UUIDs.
- Foreign keys: Enforce referential integrity (e.g. `project_id` -> `projects.id`).
- Unique constraints: As applicable (e.g., user emails).
- Organization ownership: All tenant data must have an `organization_id`.
- RLS requirements: All queries must map to `auth.uid()` and `organization_members`.
- Retention: Preserve historical advertisement observations, do not just overwrite.
""",

    "API.md": """# API Specification

IMPLEMENTATION DECISION REQUIRED: Exact REST/GraphQL endpoint definitions and payload schemas to be finalized during Next.js API route implementation.
""",

    "AUTHORIZATION.md": """# Authorization

- Authentication via Supabase Auth.
- JWT validation on all protected routes.
- Organization membership dictates access.
- Roles: `owner`, `admin`, `member`, `viewer`.
- Every organization-owned resource must be tenant isolated.
- RLS must strictly use `auth.uid()` plus organization membership.
- Do not rely on frontend filtering for authorization.
- Do not rely on hidden UI elements for security.
- Backend authorization is mandatory.
""",

    "SECURITY.md": """# Security

- **Authentication & Authorization**: Supabase Auth and strict PostgreSQL RLS.
- **Secret management**: No secrets in source code, use Vercel/Blitz Cloud environment variables.
- **API validation**: Strict input validation on all routes.
- **Rate limiting**: Enforced via Valkey.
- **Idempotency**: Required for mutations and webhooks.
- **Webhook security**: Signature verification for Paddle and n8n.
- **Crawler protections**: Block localhost, 127.0.0.1, IPv6 loopback, private IP ranges, link-local addresses, cloud metadata endpoints, internal network targets. Only HTTP/HTTPS is permitted.
- **Other crawler rules**: SSRF prevention, DNS rebinding prevention, Redirect validation, Request size limits, Request timeouts, Content-type restrictions, Redirect limits.
""",

    "AI_SYSTEM.md": """# AI System

## AI Gateway
- Providers: Gemini (Primary), Claude.
- Direct provider calls scattered through the codebase are prohibited.
- All AI calls must pass through the AI Gateway.

## Tracking & Logs
Track: provider, model, prompt version, schema version, source content version, generated timestamp, input hash, output hash, prompt tokens, completion tokens, estimated cost, confidence, manual correction status.

## Processing
- Small low-latency AI operations may run synchronously.
- Large/batch/long-running operations must run through workers.

## Prompt Injection Defenses
- Separate instructions from external data.
- Validate structured outputs.
- Never allow external content to override system instructions.
- Validate AI output against schemas.
""",

    "INTEGRATIONS.md": """# Integrations

## Paddle
- Checkout, Subscriptions, Webhooks, Signature verification, Idempotency, DB-backed entitlement state.

## Meta
- Meta Ad Library is a critical dependency. DO NOT implement fake Meta data.
- Before production ingestion: Verify API availability, permissions, access requirements, rate limits, restrictions, and document assumptions.
- Build a provider abstraction so the acquisition method can change without rewriting the intelligence system.

## Google Ads
- OAuth 2.0, Search-term import, Secure credential storage. Never mutate customer accounts automatically.

## n8n
- CRM sync, Report delivery, Recurring workflows, External webhooks.

## Resend
- Transactional email, Notifications, Reports.
""",

    "BILLING.md": """# Billing

Paddle is the ONLY billing provider. Stripe must not exist anywhere.

## Subscription Lifecycle
- Customer creation & Checkout via Paddle.
- Monthly & Annual billing.
- Trials (if implemented).
- Upgrades, Downgrades, Renewals, Failed payments, Cancellations, Refunds.

## Webhooks
- Webhook verification is required.
- Webhook idempotency is required.
- Entitlement enforcement via Database.

## Required Subscription States
`trialing`, `active`, `past_due`, `paused`, `canceled`, `expired`.

Never trust billing state supplied by the frontend.
""",

    "JOBS_AND_WORKERS.md": """# Jobs and Workers

## Strategy
- **Queue strategy**: Valkey (Database: adintelix) for transient queue/coordination needs.
- **Job types**: Ad ingestion, AI batch analysis, web crawling.
- **Workers**: Run on Blitz Cloud using Docker.
- **Data Truth**: PostgreSQL remains the source of truth.

## Handling
- Retry strategy, Idempotency, Failure handling, Rate-limit handling, Dead-letter/failure strategy.
- Worker responsibilities: Heavy processing, large reports, long-running processing.
""",

    "N8N.md": """# n8n

Deployment: Self-hosted Community Edition on Blitz Cloud.
URL: `https://n8n.marksman.blitz.cloud`

## Configuration
- Authentication, Webhooks, Workflow naming, Credential management, Encryption key, Persistent data, Failure handling, Logging, Backup expectations.

## IMPORTANT CONSTRAINT
The current Blitz free plan can sleep. Core AdIntelix functionality MUST NOT depend on n8n being continuously awake. Critical product operations must continue working when n8n is unavailable.
""",

    "OBSERVABILITY.md": """# Observability

- **Sentry**: Errors, Exceptions, Performance issues.
- **PostHog**: Product analytics, Feature usage, Tenant/feature cost tracking where appropriate.
- **Logs**: Application, Worker, n8n, Integration failures, AI usage, Billing events.
- **Health Checks**: Create health checks for critical services.
""",

    "TESTING.md": """# Testing

## Vitest
- Unit tests, Integration tests, Deterministic scoring, Queue logic, RLS verification.

## Playwright
- Login, Projects, Reporting, Critical user journeys.

## AI Evaluation
- Fixed test dataset, Structured-output validation, Regression tests.

## Security Tests
- SSRF, Cross-tenant access, Rate limits, Malformed webhooks, Authorization bypass attempts.
""",

    "DEPLOYMENT.md": """# Deployment

## Infrastructure
- **Vercel**: Next.js, Standard API routes.
- **Supabase**: Database, Auth, Storage.
- **Layerbase**: Valkey 8.0 (Database: adintelix).
- **Blitz Cloud**: Docker, n8n, Workers.
- **GitHub**: Source control, CI/CD.

## Environments
Document development, test, and production environments.
""",

    "ENVIRONMENT.md": """# Environment Configuration

`.env.example` must contain only variable names. Never commit credentials. Validate required environment variables at application startup and fail clearly when required production configuration is missing.

Required Variable Categories:
- Supabase
- Valkey
- Gemini
- Claude
- Paddle
- n8n
- Sentry
- PostHog
- Resend
- Meta
- Google Ads
""",

    "DATA_PROVENANCE.md": """# Data Provenance

Track: Original source, Acquisition timestamp, Content hashes, Processing status, Data lifecycle, Retention status.

Preserve historical advertisement observations. Do not simply overwrite historical observations.
""",

    "ADR.md": """# Architecture Decision Records

- ADR-001 Infrastructure Strategy
- ADR-002 Supabase/PostgreSQL
- ADR-003 Authentication and RLS
- ADR-004 Layerbase/Valkey
- ADR-005 Blitz Cloud Workers
- ADR-006 Self-hosted n8n
- ADR-007 Paddle Billing
- ADR-008 AI Gateway
- ADR-009 Meta Ad Library Dependency
- ADR-010 Web Crawling Security
- ADR-011 Deterministic vs AI Processing

IMPLEMENTATION DECISION REQUIRED: Full text of each ADR (Context, Decision, Consequences, Status) to be populated as implementation proceeds.
""",

    "IMPLEMENTATION_PLAN.md": """# Implementation Plan

- **Phase 1**: Project foundation, Environment configuration, Supabase, Auth, RLS, Database migrations.
- **Phase 2**: Application architecture, Organization management, Projects, Core UI.
- **Phase 3**: Valkey, Queue infrastructure, Workers, Job processing.
- **Phase 4**: AI Gateway, Gemini, Claude, AI logging, AI evaluation.
- **Phase 5**: Competitor Ad Intelligence, Advertisement model, Historical observations, Data provenance.
- **Phase 6**: Meta integration verification, Provider abstraction, Ad ingestion.
- **Phase 7**: Remaining intelligence features.
- **Phase 8**: Paddle billing, Entitlements, Webhooks.
- **Phase 9**: n8n workflows, Notifications, Reports, External integrations.
- **Phase 10**: Monitoring, Security testing, E2E testing, Performance testing, Production deployment.

Do not implement dependent features before their foundations are ready.
""",

    "DEFINITION_OF_DONE.md": """# Definition of Done

A feature is NOT complete merely because the UI works.
Each feature must include, where applicable:
- Database schema
- RLS
- Authentication
- Authorization
- Validation
- Error handling
- Loading states
- Empty states
- Retry behavior
- Idempotency
- Logging
- Monitoring
- Tests
- Security controls
- Performance considerations
- Documentation
- Production environment configuration
""",

    "ARCHITECTURE_LOCK.md": """# Architecture Lock

THE FOLLOWING ARE LOCKED:
- Next.js + TypeScript
- Vercel
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- PostgreSQL RLS
- Layerbase / Valkey 8.0
- Blitz Cloud
- Docker
- Self-hosted n8n Community Edition
- Gemini + Claude through AI Gateway
- Paddle
- Sentry
- PostHog
- Resend
- GitHub

REMOVED:
- Stripe
- Railway
- Oracle Cloud
- Upstash

Architectural changes after this point require an ADR. Do not silently substitute infrastructure. Do not add technologies simply because they are popular.
"""
}

for filename, content in docs.items():
    with open(os.path.join(docs_dir, filename), "w", encoding="utf-8") as f:
        f.write(content)

print("Documentation generated successfully.")
