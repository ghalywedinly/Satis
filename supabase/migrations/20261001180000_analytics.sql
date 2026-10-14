-- Phase 5: dashboard analytics.
-- Two read-only functions that aggregate responses for one business. They run as the caller
-- (security invoker), so row level security limits them to businesses the caller belongs to.
-- They return counts only; percentages (CSAT, NPS) are computed by the app from these counts.
-- Days are calendar days in Saudi time.

create function public.get_analytics(
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
  with scoped as (
    select r.*
    from public.survey_responses r
    where r.organization_id = p_organization_id
      and (p_location_id is null or r.location_id = p_location_id)
      and (p_survey_id is null or r.survey_id = p_survey_id)
  ),
  current_period as (
    select * from scoped where submitted_at >= p_from and submitted_at < p_to
  ),
  previous_period as (
    select * from scoped where submitted_at >= p_from - (p_to - p_from) and submitted_at < p_from
  ),
  days as (
    select d::date as day
    from generate_series(
      (p_from at time zone 'Asia/Riyadh')::date,
      ((p_to - interval '1 microsecond') at time zone 'Asia/Riyadh')::date,
      interval '1 day'
    ) d
  )
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'responses', count(*),
        'comments', count(*) filter (where has_comment),
        'csatCount', count(csat_score),
        'csatSatisfied', count(*) filter (where csat_score >= 4),
        'csatSum', coalesce(sum(csat_score), 0),
        'npsCount', count(nps_score),
        'promoters', count(*) filter (where nps_score >= 9),
        'detractors', count(*) filter (where nps_score <= 6)
      )
      from current_period
    ),
    'previous', (
      select jsonb_build_object(
        'responses', count(*),
        'csatCount', count(csat_score),
        'csatSatisfied', count(*) filter (where csat_score >= 4),
        'npsCount', count(nps_score),
        'promoters', count(*) filter (where nps_score >= 9),
        'detractors', count(*) filter (where nps_score <= 6)
      )
      from previous_period
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', d.day,
        'responses', coalesce(s.responses, 0),
        'csatCount', coalesce(s.csat_count, 0),
        'csatSatisfied', coalesce(s.csat_satisfied, 0)
      ) order by d.day), '[]'::jsonb)
      from days d
      left join (
        select (submitted_at at time zone 'Asia/Riyadh')::date as day,
               count(*) as responses,
               count(csat_score) as csat_count,
               count(*) filter (where csat_score >= 4) as csat_satisfied
        from current_period
        group by 1
      ) s on s.day = d.day
    ),
    'csatDistribution', (
      select jsonb_agg(jsonb_build_object('score', n, 'count', (select count(*) from current_period where csat_score = n)) order by n)
      from generate_series(1, 5) n
    ),
    'locations', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'responses', coalesce(s.responses, 0),
        'csatCount', coalesce(s.csat_count, 0),
        'csatSatisfied', coalesce(s.csat_satisfied, 0),
        'npsCount', coalesce(s.nps_count, 0),
        'promoters', coalesce(s.promoters, 0),
        'detractors', coalesce(s.detractors, 0)
      ) order by coalesce(s.responses, 0) desc, l.name), '[]'::jsonb)
      from public.locations l
      left join (
        select location_id,
               count(*) as responses,
               count(csat_score) as csat_count,
               count(*) filter (where csat_score >= 4) as csat_satisfied,
               count(nps_score) as nps_count,
               count(*) filter (where nps_score >= 9) as promoters,
               count(*) filter (where nps_score <= 6) as detractors
        from current_period
        group by location_id
      ) s on s.location_id = l.id
      where l.organization_id = p_organization_id
        and (p_location_id is null or l.id = p_location_id)
        and (l.archived_at is null or s.responses > 0)
    )
  );
$$;

-- Per-question results for one survey: answer counts, averages for scores, counts per option.
-- Question ids stay the same across published versions, so results add up over edits.
create function public.get_question_stats(
  p_organization_id uuid,
  p_survey_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_location_id uuid default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with answers as (
    select a.*
    from public.survey_answers a
    join public.survey_responses r on r.id = a.response_id
    where r.organization_id = p_organization_id
      and r.survey_id = p_survey_id
      and r.submitted_at >= p_from and r.submitted_at < p_to
      and (p_location_id is null or r.location_id = p_location_id)
  )
  select coalesce(jsonb_object_agg(q.question_id, jsonb_build_object(
    'answers', q.answers,
    'average', q.average,
    'numbers', coalesce((
      select jsonb_object_agg(n.value_number, n.count)
      from (select value_number, count(*) as count from answers where question_id = q.question_id and value_number is not null group by 1) n
    ), '{}'::jsonb),
    'options', coalesce((
      select jsonb_object_agg(o.option_id, o.count)
      from (select unnest(value_option_ids) as option_id, count(*) as count from answers where question_id = q.question_id group by 1) o
    ), '{}'::jsonb)
  )), '{}'::jsonb)
  from (
    select question_id, count(*) as answers, round(avg(value_number), 2) as average
    from answers
    group by question_id
  ) q;
$$;

revoke execute on function
  public.get_analytics(uuid, timestamptz, timestamptz, uuid, uuid),
  public.get_question_stats(uuid, uuid, timestamptz, timestamptz, uuid)
from public, anon;
grant execute on function
  public.get_analytics(uuid, timestamptz, timestamptz, uuid, uuid),
  public.get_question_stats(uuid, uuid, timestamptz, timestamptz, uuid)
to authenticated;

