SET search_path = public, extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- ORGANIZATIONS
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now() not null
);

-- ORGANIZATION MEMBERS
create type member_role as enum ('owner', 'admin', 'member', 'viewer');

create table public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role member_role default 'member' not null,
  created_at timestamptz default now() not null,
  primary key (organization_id, user_id)
);

-- SUBSCRIPTIONS
create type subscription_status as enum ('trialing', 'active', 'past_due', 'paused', 'canceled', 'expired');

create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  paddle_subscription_id text,
  paddle_customer_id text,
  status subscription_status not null,
  plan_id text not null,
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- BILLING EVENTS
create table public.billing_events (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete set null,
  paddle_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz default now() not null
);

-- PROJECTS
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now() not null
);

-- ADVERTISEMENTS
create table public.advertisements (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  external_ad_id text,
  platform text not null, -- 'meta', 'google', etc.
  advertiser_name text,
  creative_type text,
  created_at timestamptz default now() not null
);

-- ADVERTISEMENT OBSERVATIONS
create table public.advertisement_observations (
  id uuid primary key default uuid_generate_v4(),
  advertisement_id uuid references public.advertisements(id) on delete cascade not null,
  observation_date date not null,
  status text, -- active, inactive
  metrics jsonb,
  created_at timestamptz default now() not null
);

-- LANDING PAGES
create table public.landing_pages (
  id uuid primary key default uuid_generate_v4(),
  advertisement_id uuid references public.advertisements(id) on delete cascade not null,
  url text not null,
  content_hash text,
  scraped_content text,
  created_at timestamptz default now() not null
);

-- DATA PROVENANCE LOGS
create table public.data_provenance_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete set null,
  source text not null,
  acquisition_timestamp timestamptz not null,
  content_hash text not null,
  processing_status text not null,
  retention_status text not null,
  created_at timestamptz default now() not null
);

-- AI USAGE LOGS
create table public.ai_usage_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  provider text not null,
  model text not null,
  prompt_version text,
  schema_version text,
  input_hash text,
  output_hash text,
  prompt_tokens int,
  completion_tokens int,
  estimated_cost numeric(10, 6),
  confidence numeric(3, 2),
  manual_correction_status boolean default false,
  generated_timestamp timestamptz not null,
  created_at timestamptz default now() not null
);

-- RLS CONFIGURATION
alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.projects enable row level security;
alter table public.advertisements enable row level security;
alter table public.advertisement_observations enable row level security;
alter table public.landing_pages enable row level security;
alter table public.data_provenance_logs enable row level security;
alter table public.ai_usage_logs enable row level security;

-- USERS RLS
create policy "Users can view their own profile" 
on public.users for select using (auth.uid() = id);

create policy "Users can update their own profile" 
on public.users for update using (auth.uid() = id);

-- ORGANIZATIONS RLS
create policy "Users can view their orgs"
on public.organizations for select
using (exists (select 1 from public.organization_members where organization_id = public.organizations.id and user_id = auth.uid()));

-- ORGANIZATION MEMBERS RLS
create policy "Users can view members of their orgs"
on public.organization_members for select
using (exists (select 1 from public.organization_members as om where om.organization_id = public.organization_members.organization_id and om.user_id = auth.uid()));

-- PROJECTS RLS
create policy "Users can view projects in their orgs"
on public.projects for select
using (exists (select 1 from public.organization_members where organization_id = public.projects.organization_id and user_id = auth.uid()));

create policy "Admins can manage projects"
on public.projects for all
using (exists (select 1 from public.organization_members where organization_id = public.projects.organization_id and user_id = auth.uid() and role in ('owner', 'admin')));

-- ADVERTISEMENTS RLS
create policy "Users can view ads in their orgs"
on public.advertisements for select
using (exists (select 1 from public.organization_members where organization_id = public.advertisements.organization_id and user_id = auth.uid()));

-- Other tables follow same org-based RLS
