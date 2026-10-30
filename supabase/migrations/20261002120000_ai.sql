-- Phase 7 (reduced at launch): AI analysis of written comments and a weekly summary.
--   * response_analyses: per comment, the sentiment and the themes customers praise or complain about.
--     Themes come from a fixed list (modules/ai/taxonomy.ts) so they can be counted and translated.
--   * ai_insights: a weekly summary per business. `observed` holds numbers computed here, in SQL;
--     `interpretation` holds the AI's wording, always shown labelled as AI-generated.
--   * ai_insight_evidence: the responses each insight is based on. An insight needs evidence.
-- Rows are written only by the server (service role). Every member can read them.

create type public.ai_sentiment as enum ('positive', 'neutral', 'negative', 'mixed');

create table public.response_analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  response_id uuid not null unique,
  sentiment public.ai_sentiment not null,
  praise_themes text[] not null default '{}',
  complaint_themes text[] not null default '{}',
  -- Every theme mentioned, either way, for filtering.
  themes text[] generated always as (praise_themes || complaint_themes) stored,
  language text check (language in ('ar', 'en', 'other')),
  model text not null,
  prompt_version text not null,
  analyzed_at timestamptz not null default now(),
  -- Unique on the same columns as the foreign key, so the API embeds one analysis per response.
  unique (response_id, organization_id),
  foreign key (response_id, organization_id) references public.survey_responses (id, organization_id) on delete cascade
);

create index response_analyses_organization_id_idx on public.response_analyses (organization_id);
create index response_analyses_themes_idx on public.response_analyses using gin (themes);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('weekly_summary')),
  period_start timestamptz not null,
  period_end timestamptz not null check (period_end > period_start),
  observed jsonb not null,
  -- {"ar": {...}, "en": {...}}: headline, summary and suggested actions in each language.
  interpretation jsonb not null,
  model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, kind, period_start)
);

create table public.ai_insight_evidence (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  insight_id uuid not null,
  response_id uuid not null,
  primary key (insight_id, response_id),
  foreign key (insight_id, organization_id) references public.ai_insights (id, organization_id) on delete cascade,
  foreign key (response_id, organization_id) references public.survey_responses (id, organization_id) on delete cascade
);

create index ai_insight_evidence_response_id_idx on public.ai_insight_evidence (response_id);

alter table public.response_analyses enable row level security;
alter table public.ai_insights enable row level security;
alter table public.ai_insight_evidence enable row level security;
revoke all on public.response_analyses, public.ai_insights, public.ai_insight_evidence from anon, authenticated;

create policy "Members can read analyses" on public.response_analyses
for select to authenticated using ((select private.is_member(organization_id)));
create policy "Members can read insights" on public.ai_insights
for select to authenticated using ((select private.is_member(organization_id)));
create policy "Members can read insight evidence" on public.ai_insight_evidence
for select to authenticated using ((select private.is_member(organization_id)));
grant select on public.response_analyses, public.ai_insights, public.ai_insight_evidence to authenticated;

-- ───────── Functions ─────────

-- Server: written comments not analysed yet, oldest first, optionally for one business.
create function public.ai_pending_comments(p_organization_id uuid default null, p_limit int default 40)
returns table (id uuid, organization_id uuid, comment_text text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.organization_id, r.comment_text
  from public.survey_responses r
  where r.has_comment and r.comment_text is not null
    and (p_organization_id is null or r.organization_id = p_organization_id)
    and r.submitted_at > now() - interval '90 days'
    and not exists (select 1 from public.response_analyses a where a.response_id = r.id)
  order by r.submitted_at
  limit least(greatest(p_limit, 1), 100);
$$;

-- Server: the facts a weekly summary is built on, computed here so the AI never invents numbers.
create function public.ai_weekly_observed(p_organization_id uuid, p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with analysed as (
    select a.*, r.location_id, r.csat_score
    from public.response_analyses a
    join public.survey_responses r on r.id = a.response_id
    where a.organization_id = p_organization_id and r.submitted_at >= p_from and r.submitted_at < p_to
  ),
  theme_counts as (
    select theme, polarity, count(*) as mentions
    from (
      select unnest(praise_themes) as theme, 'praise' as polarity from analysed
      union all
      select unnest(complaint_themes), 'complaint' from analysed
    ) t
    group by theme, polarity
  )
  select jsonb_build_object(
    'comments', (select count(*) from analysed),
    'sentiment', (select coalesce(jsonb_object_agg(sentiment, n), '{}'::jsonb) from (select sentiment, count(*) as n from analysed group by sentiment) s),
    'praise', (select coalesce(jsonb_agg(jsonb_build_object('theme', theme, 'mentions', mentions) order by mentions desc, theme), '[]'::jsonb)
               from theme_counts where polarity = 'praise'),
    'complaints', (select coalesce(jsonb_agg(jsonb_build_object('theme', theme, 'mentions', mentions) order by mentions desc, theme), '[]'::jsonb)
                   from theme_counts where polarity = 'complaint'),
    'complaintsByLocation', (
      select coalesce(jsonb_agg(jsonb_build_object('location', l.name, 'theme', c.theme, 'mentions', c.mentions) order by c.mentions desc, l.name), '[]'::jsonb)
      from (
        select location_id, unnest(complaint_themes) as theme, count(*) as mentions
        from analysed group by 1, 2
      ) c
      join public.locations l on l.id = c.location_id
    )
  );
$$;

-- Members: how often each theme came up as praise or complaint, for the dashboard filters.
create function public.get_theme_counts(
  p_organization_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_location_id uuid default null,
  p_survey_id uuid default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with analysed as (
    select a.praise_themes, a.complaint_themes
    from public.response_analyses a
    join public.survey_responses r on r.id = a.response_id
    where a.organization_id = p_organization_id
      and r.submitted_at >= p_from and r.submitted_at < p_to
      and (p_location_id is null or r.location_id = p_location_id)
      and (p_survey_id is null or r.survey_id = p_survey_id)
  )
  select jsonb_build_object(
    'analysed', (select count(*) from analysed),
    'praise', (select coalesce(jsonb_object_agg(theme, n), '{}'::jsonb) from (select unnest(praise_themes) as theme, count(*) as n from analysed group by 1) p),
    'complaints', (select coalesce(jsonb_object_agg(theme, n), '{}'::jsonb) from (select unnest(complaint_themes) as theme, count(*) as n from analysed group by 1) c)
  );
$$;

revoke execute on function
  public.ai_pending_comments(uuid, int),
  public.ai_weekly_observed(uuid, timestamptz, timestamptz),
  public.get_theme_counts(uuid, timestamptz, timestamptz, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.ai_pending_comments(uuid, int), public.ai_weekly_observed(uuid, timestamptz, timestamptz) to service_role;
grant execute on function public.get_theme_counts(uuid, timestamptz, timestamptz, uuid, uuid) to authenticated;
