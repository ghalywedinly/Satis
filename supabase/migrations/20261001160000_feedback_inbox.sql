-- Phase 4: the feedback inbox.
--   * Triage state on each response: status, read, important.
--   * The customer's written comments copied onto the response, for the list and for search.
--   * A sentiment derived from the rating (AI sentiment on comments arrives in Phase 7).
--   * Tags, defined per business and attached to responses.
-- Staff and above triage; every member can read.

create type public.response_status as enum ('new', 'in_progress', 'resolved');

alter table public.survey_responses
  add column status public.response_status not null default 'new',
  add column is_read boolean not null default false,
  add column is_important boolean not null default false,
  add column comment_text text,
  -- From the CSAT rating when there is one, otherwise from the NPS score.
  add column rating_sentiment text generated always as (
    case
      when csat_score >= 4 then 'positive'
      when csat_score = 3 then 'neutral'
      when csat_score <= 2 then 'negative'
      when nps_score >= 9 then 'positive'
      when nps_score >= 7 then 'neutral'
      when nps_score >= 0 then 'negative'
    end
  ) stored,
  -- Lets tags reference a response within the same business (see response_tags).
  add constraint survey_responses_id_organization_key unique (id, organization_id);

create index survey_responses_org_unread_idx on public.survey_responses (organization_id) where not is_read;

-- Copies each written answer onto its response. Runs inside submit_survey_response.
create function private.copy_comment_to_response()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.value_text is not null then
    update public.survey_responses
    set comment_text = concat_ws(E'\n', comment_text, new.value_text)
    where id = new.response_id;
  end if;
  return new;
end;
$$;

create trigger survey_answers_copy_comment after insert on public.survey_answers
for each row execute function private.copy_comment_to_response();

update public.survey_responses r
set comment_text = (
  select string_agg(a.value_text, E'\n' order by a.id)
  from public.survey_answers a
  where a.response_id = r.id and a.value_text is not null
)
where r.has_comment;

-- ───────── Tags ─────────

create table public.feedback_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40 and name = btrim(name)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

create unique index feedback_tags_org_name_key on public.feedback_tags (organization_id, lower(name));

create trigger feedback_tags_set_updated_at before update on public.feedback_tags
for each row execute function private.set_updated_at();

create table public.response_tags (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  response_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (response_id, tag_id),
  -- Both sides must belong to the same business as the row.
  foreign key (response_id, organization_id) references public.survey_responses (id, organization_id) on delete cascade,
  foreign key (tag_id, organization_id) references public.feedback_tags (id, organization_id) on delete cascade
);

create index response_tags_tag_id_idx on public.response_tags (tag_id);
create index response_tags_organization_id_idx on public.response_tags (organization_id);

-- ───────── Row Level Security ─────────

alter table public.feedback_tags enable row level security;
alter table public.response_tags enable row level security;
revoke all on public.feedback_tags, public.response_tags from anon, authenticated;

create policy "Staff can triage responses" on public.survey_responses
for update to authenticated
using ((select private.has_role(organization_id, 'staff')))
with check ((select private.has_role(organization_id, 'staff')));
grant update (status, is_read, is_important) on public.survey_responses to authenticated;

create policy "Members can read tags" on public.feedback_tags
for select to authenticated using ((select private.is_member(organization_id)));
create policy "Staff can create tags" on public.feedback_tags
for insert to authenticated with check ((select private.has_role(organization_id, 'staff')));
grant select on public.feedback_tags to authenticated;
grant insert (organization_id, name) on public.feedback_tags to authenticated;

create policy "Members can read response tags" on public.response_tags
for select to authenticated using ((select private.is_member(organization_id)));
create policy "Staff can tag responses" on public.response_tags
for insert to authenticated with check ((select private.has_role(organization_id, 'staff')));
create policy "Staff can untag responses" on public.response_tags
for delete to authenticated using ((select private.has_role(organization_id, 'staff')));
grant select, delete on public.response_tags to authenticated;
grant insert (organization_id, response_id, tag_id) on public.response_tags to authenticated;

-- ───────── Functions ─────────

-- Tags a response, creating the tag if the business doesn't have it yet (names match case-insensitively).
-- Runs as the caller, so the policies above decide who may do it.
create function public.add_response_tag(p_response_id uuid, p_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  org uuid;
  clean_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  tag uuid;
begin
  select organization_id into org from public.survey_responses where id = p_response_id;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not (select private.has_role(org, 'staff')) then raise exception 'forbidden' using errcode = '42501'; end if;
  if char_length(clean_name) not between 1 and 40 then raise exception 'invalid_tag' using errcode = 'P0001'; end if;

  select id into tag from public.feedback_tags where organization_id = org and lower(name) = lower(clean_name);
  if not found then
    insert into public.feedback_tags (organization_id, name) values (org, clean_name)
    on conflict (organization_id, lower(name)) do nothing
    returning id into tag;
    -- Someone else created it at the same moment.
    if tag is null then
      select id into tag from public.feedback_tags where organization_id = org and lower(name) = lower(clean_name);
    end if;
  end if;

  insert into public.response_tags (organization_id, response_id, tag_id) values (org, p_response_id, tag)
  on conflict do nothing;
  return tag;
end;
$$;

revoke execute on function public.add_response_tag(uuid, text) from public, anon;
grant execute on function public.add_response_tag(uuid, text) to authenticated;
