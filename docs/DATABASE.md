# Database Schema

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
