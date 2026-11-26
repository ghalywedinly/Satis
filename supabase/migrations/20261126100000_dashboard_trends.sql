-- Dashboard trends: day-by-day series for this period and the one before it (for charts that
-- compare the two), busy hours (responses and low ratings by weekday and hour), and the rating
-- sum per location (for each branch's average score).
-- Runs as the caller (security invoker), so row level security limits it to the caller's
-- businesses. Counts only; the app computes percentages and averages. Saudi time throughout.

create function public.get_dashboard_trends(
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
    select r.submitted_at, r.location_id, r.csat_score, r.nps_score, r.has_comment, r.rating_sentiment
    from public.survey_responses r
    where r.organization_id = p_organization_id
      and (p_location_id is null or r.location_id = p_location_id)
      and (p_survey_id is null or r.survey_id = p_survey_id)
      and r.submitted_at >= p_from - (p_to - p_from)
      and r.submitted_at < p_to
  ),
  days as (
    select (row_number() over (order by d) - 1)::int as idx, d::date as day
    from generate_series(
      (p_from at time zone 'Asia/Riyadh')::date,
      ((p_to - interval '1 microsecond') at time zone 'Asia/Riyadh')::date,
      interval '1 day'
    ) d
  ),
  day_count as (select count(*)::int as n from days),
  per_day as (
    select (submitted_at at time zone 'Asia/Riyadh')::date as day,
           count(*) as responses,
           count(*) filter (where has_comment) as comments,
           count(csat_score) as csat_count,
           count(*) filter (where csat_score >= 4) as csat_satisfied,
           coalesce(sum(csat_score), 0) as csat_sum,
           count(nps_score) as nps_count,
           count(*) filter (where nps_score >= 9) as promoters,
           count(*) filter (where nps_score <= 6) as detractors
    from scoped
    group by 1
  ),
  series as (
    select d.idx, d.day, false as previous, p.responses, p.comments, p.csat_count, p.csat_satisfied, p.csat_sum, p.nps_count, p.promoters, p.detractors
    from days d left join per_day p on p.day = d.day
    union all
    select d.idx, (d.day - (select n from day_count)), true, p.responses, p.comments, p.csat_count, p.csat_satisfied, p.csat_sum, p.nps_count, p.promoters, p.detractors
    from days d left join per_day p on p.day = d.day - (select n from day_count)
  )
  select jsonb_build_object(
    'current', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', s.day,
        'responses', coalesce(s.responses, 0),
        'comments', coalesce(s.comments, 0),
        'csatCount', coalesce(s.csat_count, 0),
        'csatSatisfied', coalesce(s.csat_satisfied, 0),
        'csatSum', coalesce(s.csat_sum, 0),
        'npsCount', coalesce(s.nps_count, 0),
        'promoters', coalesce(s.promoters, 0),
        'detractors', coalesce(s.detractors, 0)
      ) order by s.idx), '[]'::jsonb)
      from series s where not s.previous
    ),
    'previous', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', s.day,
        'responses', coalesce(s.responses, 0),
        'comments', coalesce(s.comments, 0),
        'csatCount', coalesce(s.csat_count, 0),
        'csatSatisfied', coalesce(s.csat_satisfied, 0),
        'csatSum', coalesce(s.csat_sum, 0),
        'npsCount', coalesce(s.nps_count, 0),
        'promoters', coalesce(s.promoters, 0),
        'detractors', coalesce(s.detractors, 0)
      ) order by s.idx), '[]'::jsonb)
      from series s where s.previous
    ),
    -- dow: 0 = Sunday … 6 = Saturday.
    'busyHours', (
      select coalesce(jsonb_agg(jsonb_build_object('dow', h.dow, 'hour', h.hour, 'responses', h.responses, 'negative', h.negative) order by h.dow, h.hour), '[]'::jsonb)
      from (
        select extract(dow from submitted_at at time zone 'Asia/Riyadh')::int as dow,
               extract(hour from submitted_at at time zone 'Asia/Riyadh')::int as hour,
               count(*) as responses,
               count(*) filter (where rating_sentiment = 'negative') as negative
        from scoped
        where submitted_at >= p_from
        group by 1, 2
      ) h
    ),
    'locationScores', (
      select coalesce(jsonb_agg(jsonb_build_object('id', l.location_id, 'csatSum', l.csat_sum) order by l.location_id), '[]'::jsonb)
      from (
        select location_id, coalesce(sum(csat_score), 0) as csat_sum
        from scoped
        where submitted_at >= p_from and location_id is not null
        group by location_id
      ) l
    )
  );
$$;

revoke execute on function public.get_dashboard_trends(uuid, timestamptz, timestamptz, uuid, uuid) from public, anon;
grant execute on function public.get_dashboard_trends(uuid, timestamptz, timestamptz, uuid, uuid) to authenticated;
