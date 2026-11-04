-- Research studies: a pre-survey and a post-survey measured together in one report.
--   * studies: the research project. When match_participants is on, every answer carries a
--     participant code, so the report can compare each person's before and after.
--   * surveys.study_id / study_phase: the two surveys of a study ('pre' and 'post'). They are
--     ordinary surveys (builder, QR links, publishing), created together by create_study().
--   * survey_responses.participant_code: the code a participant entered (or that came in the link).
-- Also widens survey design: custom colours, a font, and an uploaded logo.

-- ───────── Studies ─────────

create table public.studies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text check (char_length(description) <= 1000),
  match_participants boolean not null default true,
  archived_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index studies_organization_id_idx on public.studies (organization_id);

create trigger studies_set_updated_at before update on public.studies
for each row execute function private.set_updated_at();
create trigger studies_audit after insert or update on public.studies
for each row execute function private.write_audit();

alter table public.studies enable row level security;
revoke all on public.studies from anon, authenticated;

create policy "Members can read studies" on public.studies
for select to authenticated using ((select private.is_member(organization_id)));
create policy "Managers can edit studies" on public.studies
for update to authenticated
using ((select private.has_role(organization_id, 'manager')))
with check ((select private.has_role(organization_id, 'manager')));
grant select on public.studies to authenticated;
-- Created only through create_study(), which makes its two surveys at the same time.
grant update (name, description, match_participants, archived_at) on public.studies to authenticated;

-- A study's surveys. Set only by create_study() (no column grant), so a survey can never be
-- attached to another business's study.
alter table public.surveys
  add column study_id uuid references public.studies (id) on delete cascade,
  add column study_phase text check (study_phase in ('pre', 'post')),
  add constraint surveys_study_pair_check check ((study_id is null) = (study_phase is null));

create unique index surveys_study_phase_key on public.surveys (study_id, study_phase) where study_id is not null;

-- Codes are stored upper-case: "p-014" and "P-014" are the same participant.
alter table public.survey_responses
  add column participant_code text check (participant_code ~ '^[A-Z0-9_-]{1,40}$');

-- One answer per participant per survey: a second attempt with the same code is refused.
create unique index survey_responses_participant_key on public.survey_responses (survey_id, participant_code)
where participant_code is not null;

-- ───────── Survey design: custom colours, font and logo ─────────

create function private.valid_survey_theme(theme jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(theme) = 'object'
    and coalesce(theme ->> 'accent', 'ultramarine') in ('ultramarine', 'ember', 'mint', 'grape', 'ink', 'custom')
    and coalesce(theme ->> 'background', 'sand') in ('sand', 'white', 'ink', 'tint', 'custom')
    and coalesce(theme ->> 'ratingStyle', 'slices') in ('slices', 'stars', 'faces', 'numbers', 'hearts')
    and coalesce(theme ->> 'font', 'satis') in ('satis', 'cairo', 'tajawal', 'plex', 'almarai', 'kufi', 'naskh')
    and (theme ->> 'accent' is distinct from 'custom' or coalesce(theme ->> 'accentColor', '') ~ '^#[0-9A-Fa-f]{6}$')
    and (theme ->> 'background' is distinct from 'custom' or coalesce(theme ->> 'backgroundColor', '') ~ '^#[0-9A-Fa-f]{6}$')
    and (theme -> 'accentColor' is null or theme ->> 'accentColor' ~ '^#[0-9A-Fa-f]{6}$')
    and (theme -> 'backgroundColor' is null or theme ->> 'backgroundColor' ~ '^#[0-9A-Fa-f]{6}$')
    and (
      theme -> 'logo' is null
      or jsonb_typeof(theme -> 'logo') = 'null'
      or (
        jsonb_typeof(theme -> 'logo') = 'object'
        -- A small image embedded in the survey (resized in the browser before upload).
        and theme -> 'logo' ->> 'src' ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$'
        and char_length(theme -> 'logo' ->> 'src') <= 400000
        and coalesce(theme -> 'logo' ->> 'position', 'center') in ('start', 'center', 'end')
        and coalesce(theme -> 'logo' ->> 'size', 'md') in ('sm', 'md', 'lg')
      )
    );
$$;

alter table public.surveys drop constraint surveys_theme_check;
alter table public.surveys add constraint surveys_theme_check check (private.valid_survey_theme(theme));

-- ───────── Functions ─────────

-- Creates a study with its pre- and post-survey (same questions, so they can be compared).
-- Managers and above. Survey content is validated by the application, like any survey draft.
create function public.create_study(
  p_organization_id uuid,
  p_name text,
  p_description text,
  p_match_participants boolean,
  p_pre_name text,
  p_post_name text,
  p_locales public.app_locale[],
  p_default_locale public.app_locale,
  p_questions jsonb,
  p_thank_you jsonb,
  p_theme jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  study_id uuid;
begin
  if not private.has_role(p_organization_id, 'manager') then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  insert into public.studies (organization_id, name, description, match_participants, created_by)
  values (p_organization_id, btrim(p_name), nullif(btrim(p_description), ''), p_match_participants, (select auth.uid()))
  returning id into study_id;

  insert into public.surveys (organization_id, name, locales, default_locale, questions, thank_you, theme, study_id, study_phase, created_by)
  values
    (p_organization_id, btrim(p_pre_name), p_locales, p_default_locale, p_questions, p_thank_you, p_theme, study_id, 'pre', (select auth.uid())),
    (p_organization_id, btrim(p_post_name), p_locales, p_default_locale, p_questions, p_thank_you, p_theme, study_id, 'post', (select auth.uid()));

  return study_id;
end;
$$;

-- Every response of a study with its answers, in one document (no row limits), for the report and
-- the CSV export. Runs as the caller, so row level security decides what they may read.
create function public.get_study_responses(p_study_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'phase', s.study_phase,
    'participant', r.participant_code,
    'submittedAt', r.submitted_at,
    'locale', r.locale,
    'location', l.name,
    'answers', (
      select coalesce(jsonb_object_agg(a.question_id, jsonb_strip_nulls(jsonb_build_object(
        'number', a.value_number, 'options', to_jsonb(a.value_option_ids), 'text', a.value_text
      ))), '{}'::jsonb)
      from public.survey_answers a
      where a.response_id = r.id
    )
  ) order by r.submitted_at, s.study_phase desc), '[]'::jsonb)
  from public.surveys s
  join public.survey_responses r on r.survey_id = s.id
  left join public.locations l on l.id = r.location_id
  where s.study_id = p_study_id;
$$;

-- Same as before, plus the study phase and whether the survey asks for a participant code.
create or replace function public.get_public_survey(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'linkId', l.id,
    'organizationName', o.name,
    'locationName', loc.name,
    'versionId', v.id,
    'definition', v.definition,
    'study', case when st.id is not null then jsonb_build_object('phase', s.study_phase, 'matchParticipants', st.match_participants) end
  )
  from public.survey_links l
  join public.surveys s on s.id = l.survey_id
  join public.survey_versions v on v.id = s.current_version_id
  join public.organizations o on o.id = l.organization_id
  join public.locations loc on loc.id = l.location_id
  left join public.studies st on st.id = s.study_id and st.archived_at is null
  where l.public_code = p_code
    and l.is_active
    and s.status = 'published'
    and loc.archived_at is null
    and (s.study_id is null or st.id is not null)
$$;

-- Same as before, plus the participant code for study surveys that match participants.
drop function public.submit_survey_response(text, uuid, uuid, public.app_locale, jsonb, text);

create function public.submit_survey_response(
  p_code text,
  p_version_id uuid,
  p_submission_id uuid,
  p_locale public.app_locale,
  p_answers jsonb,
  p_device_type text,
  p_participant_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  link public.survey_links;
  survey public.surveys;
  study public.studies;
  definition jsonb;
  question jsonb;
  answer jsonb;
  question_ids text[] := '{}';
  option_ids text[];
  chosen text[];
  number_value integer;
  text_value text;
  csat smallint;
  nps smallint;
  comment boolean := false;
  participant text;
  response_id uuid;
begin
  select id into response_id from public.survey_responses where submission_id = p_submission_id;
  if found then return response_id; end if;

  select * into link from public.survey_links where public_code = p_code and is_active;
  if not found then raise exception 'survey_unavailable' using errcode = 'P0001'; end if;
  select * into survey from public.surveys where id = link.survey_id;
  if survey.status <> 'published'
     or exists (select 1 from public.locations where id = link.location_id and archived_at is not null) then
    raise exception 'survey_unavailable' using errcode = 'P0001';
  end if;
  if survey.study_id is not null then
    select * into study from public.studies where id = survey.study_id;
    if study.archived_at is not null then raise exception 'survey_unavailable' using errcode = 'P0001'; end if;
    if study.match_participants then
      participant := upper(btrim(coalesce(p_participant_code, '')));
      if participant !~ '^[A-Z0-9_-]{1,40}$' then raise exception 'invalid_participant' using errcode = 'P0001'; end if;
      if exists (select 1 from public.survey_responses where survey_id = survey.id and participant_code = participant) then
        raise exception 'already_answered' using errcode = 'P0001';
      end if;
    end if;
  end if;
  -- The survey was republished while the customer was answering.
  if survey.current_version_id <> p_version_id then
    raise exception 'survey_changed' using errcode = 'P0001';
  end if;
  select v.definition into definition from public.survey_versions v where v.id = survey.current_version_id;
  if not (p_locale::text in (select jsonb_array_elements_text(definition -> 'locales'))) then
    raise exception 'invalid_answer' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_answers) <> 'object' then raise exception 'invalid_answer' using errcode = 'P0001'; end if;

  begin
    insert into public.survey_responses (organization_id, survey_id, survey_version_id, location_id, link_id, submission_id, locale, device_type, participant_code)
    values (link.organization_id, link.survey_id, survey.current_version_id, link.location_id, link.id, p_submission_id, p_locale,
            case when p_device_type in ('mobile', 'tablet', 'desktop') then p_device_type end, participant)
    returning id into response_id;
  exception when unique_violation then
    -- Two submissions with the same code at the same moment.
    if participant is not null then raise exception 'already_answered' using errcode = 'P0001'; end if;
    raise;
  end;

  for question in select * from jsonb_array_elements(definition -> 'questions') loop
    question_ids := question_ids || (question ->> 'id');
    answer := p_answers -> (question ->> 'id');
    if answer is null or answer = 'null'::jsonb then
      if (question ->> 'required')::boolean then raise exception 'missing_answer' using errcode = 'P0001'; end if;
      continue;
    end if;

    case question ->> 'type'
      when 'rating', 'nps' then
        if jsonb_typeof(answer -> 'number') <> 'number' then raise exception 'invalid_answer' using errcode = 'P0001'; end if;
        number_value := (answer ->> 'number')::numeric;
        if number_value::numeric <> (answer ->> 'number')::numeric
           or (question ->> 'type' = 'rating' and number_value not between 1 and 5)
           or (question ->> 'type' = 'nps' and number_value not between 0 and 10) then
          raise exception 'invalid_answer' using errcode = 'P0001';
        end if;
        insert into public.survey_answers (organization_id, response_id, question_id, value_number)
        values (link.organization_id, response_id, (question ->> 'id')::uuid, number_value);
        if question ->> 'type' = 'rating' and csat is null and coalesce(question ->> 'role', '') = 'csat' then csat := number_value; end if;
        if question ->> 'type' = 'nps' and nps is null then nps := number_value; end if;

      when 'single_choice', 'multiple_choice' then
        if jsonb_typeof(answer -> 'options') <> 'array' then raise exception 'invalid_answer' using errcode = 'P0001'; end if;
        select array_agg(o ->> 'id') into option_ids from jsonb_array_elements(question -> 'options') o;
        select array_agg(distinct c) into chosen from jsonb_array_elements_text(answer -> 'options') c;
        if chosen is null
           or not (chosen <@ option_ids)
           or cardinality(chosen) <> jsonb_array_length(answer -> 'options')
           or (question ->> 'type' = 'single_choice' and cardinality(chosen) <> 1) then
          raise exception 'invalid_answer' using errcode = 'P0001';
        end if;
        insert into public.survey_answers (organization_id, response_id, question_id, value_option_ids)
        values (link.organization_id, response_id, (question ->> 'id')::uuid, chosen::uuid[]);

      when 'text' then
        text_value := btrim(answer ->> 'text');
        if text_value is null or text_value = '' then
          if (question ->> 'required')::boolean then raise exception 'missing_answer' using errcode = 'P0001'; end if;
          continue;
        end if;
        if char_length(text_value) > 1000 then raise exception 'invalid_answer' using errcode = 'P0001'; end if;
        insert into public.survey_answers (organization_id, response_id, question_id, value_text)
        values (link.organization_id, response_id, (question ->> 'id')::uuid, text_value);
        comment := true;

      else
        raise exception 'invalid_answer' using errcode = 'P0001';
    end case;
  end loop;

  -- Answers to questions that aren't in this version are rejected.
  if exists (select 1 from jsonb_object_keys(p_answers) k where not (k = any (question_ids))) then
    raise exception 'invalid_answer' using errcode = 'P0001';
  end if;

  update public.survey_responses set csat_score = csat, nps_score = nps, has_comment = comment where id = response_id;
  return response_id;
end;
$$;

revoke execute on function
  public.create_study(uuid, text, text, boolean, text, text, public.app_locale[], public.app_locale, jsonb, jsonb, jsonb),
  public.get_study_responses(uuid),
  public.submit_survey_response(text, uuid, uuid, public.app_locale, jsonb, text, text)
from public, anon, authenticated;

grant execute on function public.create_study(uuid, text, text, boolean, text, text, public.app_locale[], public.app_locale, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.get_study_responses(uuid) to authenticated;
grant execute on function public.submit_survey_response(text, uuid, uuid, public.app_locale, jsonb, text, text) to service_role;
