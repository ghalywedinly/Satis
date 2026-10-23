-- Phase 6: coupons.
--   * coupon_offers: the reward a business attaches to a survey (optionally one location).
--   * coupon_issuances: one unique code per completed response, issued by the server only.
-- Customers get a code on the thank-you screen; staff check and redeem it in the app.
-- POS integrations later use the same issuances table.

create type public.coupon_discount_type as enum ('percent', 'amount');
create type public.coupon_offer_status as enum ('active', 'paused', 'archived');

-- Composite keys so child rows can only point inside the same business.
alter table public.surveys add constraint surveys_id_organization_key unique (id, organization_id);
alter table public.locations add constraint locations_id_organization_key unique (id, organization_id);

create table public.coupon_offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  survey_id uuid not null,
  -- Null means every location of the survey.
  location_id uuid,
  discount_type public.coupon_discount_type not null,
  -- Percent: 1–100. Amount: halalas (SAR × 100), up to 10,000 SAR.
  discount_value integer not null,
  -- Optional conditions shown with the reward, per language: {"ar": "...", "en": "..."}.
  note jsonb not null default '{}'::jsonb check (jsonb_typeof(note) = 'object'),
  valid_days smallint not null default 30 check (valid_days between 1 and 365),
  -- Null means no limit on how many codes are issued.
  usage_limit integer check (usage_limit between 1 and 1000000),
  status public.coupon_offer_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (survey_id, organization_id) references public.surveys (id, organization_id) on delete cascade,
  foreign key (location_id, organization_id) references public.locations (id, organization_id),
  check (
    (discount_type = 'percent' and discount_value between 1 and 100)
    or (discount_type = 'amount' and discount_value between 100 and 1000000)
  )
);

-- One active reward per survey, so customers always know what they get.
create unique index coupon_offers_one_active_per_survey on public.coupon_offers (survey_id) where status = 'active';
create index coupon_offers_organization_id_idx on public.coupon_offers (organization_id);

create trigger coupon_offers_set_updated_at before update on public.coupon_offers
for each row execute function private.set_updated_at();
create trigger coupon_offers_audit after insert or update on public.coupon_offers
for each row execute function private.write_audit();

create table public.coupon_issuances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  offer_id uuid not null,
  -- One code per response: retries and double taps return the same code.
  response_id uuid not null unique,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  -- The reward as it was when issued, so later edits never change a customer's code.
  discount_type public.coupon_discount_type not null,
  discount_value integer not null,
  note jsonb not null default '{}'::jsonb,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_location_id uuid,
  foreign key (offer_id, organization_id) references public.coupon_offers (id, organization_id) on delete cascade,
  foreign key (response_id, organization_id) references public.survey_responses (id, organization_id) on delete cascade,
  foreign key (redeemed_location_id, organization_id) references public.locations (id, organization_id)
);

create index coupon_issuances_offer_id_idx on public.coupon_issuances (offer_id);
create index coupon_issuances_organization_issued_idx on public.coupon_issuances (organization_id, issued_at desc);

-- ───────── Row Level Security ─────────

alter table public.coupon_offers enable row level security;
alter table public.coupon_issuances enable row level security;
revoke all on public.coupon_offers, public.coupon_issuances from anon, authenticated;

create policy "Members can read coupon offers" on public.coupon_offers
for select to authenticated using ((select private.is_member(organization_id)));
create policy "Managers can create coupon offers" on public.coupon_offers
for insert to authenticated with check ((select private.has_role(organization_id, 'manager')));
create policy "Managers can edit coupon offers" on public.coupon_offers
for update to authenticated
using ((select private.has_role(organization_id, 'manager')))
with check ((select private.has_role(organization_id, 'manager')));
grant select on public.coupon_offers to authenticated;
grant insert (organization_id, survey_id, location_id, discount_type, discount_value, note, valid_days, usage_limit)
  on public.coupon_offers to authenticated;
grant update (location_id, discount_type, discount_value, note, valid_days, usage_limit, status)
  on public.coupon_offers to authenticated;

-- Codes are issued and redeemed only through the functions below.
create policy "Members can read coupon codes" on public.coupon_issuances
for select to authenticated using ((select private.is_member(organization_id)));
grant select on public.coupon_issuances to authenticated;

-- ───────── Functions ─────────

-- 8 characters from 32 easy-to-read symbols (no 0/O, 1/I): 40 random bits.
create function private.new_coupon_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(b, i) % 32) + 1, 1), '' order by i)
  from (select uuid_send(gen_random_uuid()) as b) r, generate_series(0, 7) i;
$$;

-- Server only (after a response is saved): issues the survey's reward for this response, if any.
-- Returns the coupon to show the customer, or null when there's no active reward or it ran out.
create function public.issue_coupon(p_response_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  response public.survey_responses;
  offer public.coupon_offers;
  issued public.coupon_issuances;
  attempt int := 0;
begin
  select * into issued from public.coupon_issuances where response_id = p_response_id;
  if not found then
    select * into response from public.survey_responses where id = p_response_id;
    if not found then return null; end if;

    -- Locking the offer serializes issuing, so the usage limit can't be overrun.
    select * into offer from public.coupon_offers
    where survey_id = response.survey_id and status = 'active'
      and (location_id is null or location_id = response.location_id)
    for update;
    if not found then return null; end if;
    if offer.usage_limit is not null
       and (select count(*) from public.coupon_issuances where offer_id = offer.id) >= offer.usage_limit then
      return null;
    end if;

    loop
      begin
        insert into public.coupon_issuances
          (organization_id, offer_id, response_id, code, discount_type, discount_value, note, expires_at)
        values
          (offer.organization_id, offer.id, response.id, private.new_coupon_code(), offer.discount_type,
           offer.discount_value, offer.note, now() + make_interval(days => offer.valid_days))
        returning * into issued;
        exit;
      exception when unique_violation then
        -- Another request issued this response's code at the same moment: use it.
        select * into issued from public.coupon_issuances where response_id = p_response_id;
        exit when found;
        -- Otherwise a code collision (1 in a trillion): try a fresh code.
        attempt := attempt + 1;
        if attempt >= 5 then raise; end if;
      end;
    end loop;
  end if;

  return jsonb_build_object(
    'code', issued.code,
    'discountType', issued.discount_type,
    'discountValue', issued.discount_value,
    'note', issued.note,
    'expiresAt', issued.expires_at
  );
end;
$$;

-- Staff: what a code is worth and whether it can be used. Codes are matched ignoring case,
-- spaces and dashes, since customers read them aloud or type them from a screenshot.
create function public.lookup_coupon(p_organization_id uuid, p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  clean text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  issued public.coupon_issuances;
begin
  if not (select private.has_role(p_organization_id, 'staff')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into issued from public.coupon_issuances where code = clean and organization_id = p_organization_id;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  return jsonb_build_object(
    'status', case when issued.redeemed_at is not null then 'redeemed' when issued.expires_at <= now() then 'expired' else 'valid' end,
    'code', issued.code,
    'discountType', issued.discount_type,
    'discountValue', issued.discount_value,
    'note', issued.note,
    'issuedAt', issued.issued_at,
    'expiresAt', issued.expires_at,
    'redeemedAt', issued.redeemed_at
  );
end;
$$;

-- Staff: marks a code used. Atomic, so the same code can't be redeemed twice.
create function public.redeem_coupon(p_organization_id uuid, p_code text, p_location_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  issued public.coupon_issuances;
begin
  if not (select private.has_role(p_organization_id, 'staff')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_location_id is not null
     and not exists (select 1 from public.locations where id = p_location_id and organization_id = p_organization_id) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  update public.coupon_issuances
  set redeemed_at = now(), redeemed_by = (select auth.uid()), redeemed_location_id = p_location_id
  where code = clean and organization_id = p_organization_id and redeemed_at is null and expires_at > now()
  returning * into issued;

  if not found then
    select * into issued from public.coupon_issuances where code = clean and organization_id = p_organization_id;
    if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
    if issued.redeemed_at is not null then raise exception 'coupon_redeemed' using errcode = 'P0001'; end if;
    raise exception 'coupon_expired' using errcode = 'P0001';
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_organization_id, (select auth.uid()), 'coupon_issuances.redeem', 'coupon_issuances', issued.id, '{}'::jsonb);
  return public.lookup_coupon(p_organization_id, issued.code);
end;
$$;

revoke execute on function
  private.new_coupon_code(),
  public.issue_coupon(uuid),
  public.lookup_coupon(uuid, text),
  public.redeem_coupon(uuid, text, uuid)
from public, anon, authenticated;
grant execute on function public.issue_coupon(uuid) to service_role;
grant execute on function public.lookup_coupon(uuid, text), public.redeem_coupon(uuid, text, uuid) to authenticated;
