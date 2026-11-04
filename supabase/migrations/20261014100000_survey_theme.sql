-- Survey design: an accent colour, a page background and a style for 1–5 rating questions.
-- Stored on the draft (surveys.theme) and frozen into each published version's definition, so a
-- live survey only changes look when it is republished. Old versions without a theme render with
-- the defaults (Ultramarine, Sand, brand slices).

alter table public.surveys
  add column theme jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(theme) = 'object'
      and coalesce(theme ->> 'accent', 'ultramarine') in ('ultramarine', 'ember', 'mint', 'grape', 'ink')
      and coalesce(theme ->> 'background', 'sand') in ('sand', 'white', 'ink', 'tint')
      and coalesce(theme ->> 'ratingStyle', 'slices') in ('slices', 'stars', 'faces', 'numbers', 'hearts')
    );

-- Members who can edit a survey can set its design (the same RLS policies apply).
grant insert (theme), update (theme) on public.surveys to authenticated;

-- Changing the design of a live survey is an unpublished change too.
create or replace function private.mark_unpublished_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.current_version_id is not distinct from old.current_version_id
     and (new.questions, new.thank_you, new.locales, new.default_locale, new.theme)
         is distinct from (old.questions, old.thank_you, old.locales, old.default_locale, old.theme)
     and new.current_version_id is not null
  then
    new.has_unpublished_changes := true;
  end if;
  return new;
end;
$$;

-- Same as before, plus the theme in the frozen definition.
create or replace function public.publish_survey(p_survey_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  survey public.surveys;
  next_version integer;
  version_id uuid;
begin
  select * into survey from public.surveys where id = p_survey_id for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.has_role(survey.organization_id, 'manager') then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if survey.status = 'archived' then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if jsonb_array_length(survey.questions) not between 1 and 10 then
    raise exception 'invalid_survey' using errcode = 'P0001';
  end if;

  select coalesce(max(version), 0) + 1 into next_version from public.survey_versions where survey_id = p_survey_id;

  insert into public.survey_versions (organization_id, survey_id, version, definition, published_by)
  values (
    survey.organization_id, p_survey_id, next_version,
    jsonb_build_object(
      'questions', survey.questions,
      'thankYou', survey.thank_you,
      'locales', to_jsonb(survey.locales),
      'defaultLocale', survey.default_locale,
      'theme', survey.theme
    ),
    (select auth.uid())
  )
  returning id into version_id;

  update public.surveys
  set current_version_id = version_id, status = 'published', has_unpublished_changes = false
  where id = p_survey_id;
  return version_id;
end;
$$;
