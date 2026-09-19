-- ===========================================================================
-- Alpha Adventures — 0002 core schema (IDEMPOTENT). Runs after 0001_leads.sql.
-- Safe to re-run on the live DB (converges) and reproducible on a fresh project.
-- Money = bigint paise (INR). IDs = uuid (gen_random_uuid). Timestamps = timestamptz.
-- NOTE: extends the existing `leads` table (from 0001_leads) via ALTER, not create.
-- ===========================================================================

-- ---------- Enums (guarded) ------------------------------------------------
do $$ begin create type app_role as enum ('customer','staff','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type gender as enum ('male','female','other','prefer_not_to_say'); exception when duplicate_object then null; end $$;
do $$ begin create type content_status as enum ('draft','published','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type trek_difficulty as enum ('beginner','moderate','difficult'); exception when duplicate_object then null; end $$;
do $$ begin create type departure_status as enum ('scheduled','open','full','closed','cancelled','completed'); exception when duplicate_object then null; end $$;
do $$ begin create type booking_status as enum ('draft','pending_payment','payment_processing','confirmed','cancelled','expired','completed'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_status as enum ('pending','processing','success','failed','cancelled','expired','refunded','partially_refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type refund_status as enum ('pending','processing','completed','failed'); exception when duplicate_object then null; end $$;
do $$ begin create type lead_status as enum ('new','contacted','qualified','converted','closed'); exception when duplicate_object then null; end $$;
do $$ begin create type points_txn_type as enum ('earn','redeem','expire','refund_credit','adjustment'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_channel as enum ('email','sms','whatsapp','in_app'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_status as enum ('pending','sent','failed'); exception when duplicate_object then null; end $$;

-- ---------- Shared trigger fns ---------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

-- ===========================================================================
-- IDENTITY
-- ===========================================================================
create table if not exists profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  first_name                text,
  last_name                 text,
  email                     text,
  phone                     text,
  avatar_media_id           uuid,
  date_of_birth             date,
  gender                    gender,
  address                   text,
  blood_group               text,
  medical_conditions        text,
  emergency_contact_name    text,
  emergency_contact_phone   text,
  medical_clearance_status  text not null default 'pending',
  status                    text not null default 'active',
  deleted_at                timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table if not exists user_roles (
  user_id    uuid not null references profiles(id) on delete cascade,
  role       app_role not null,
  granted_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index if not exists idx_user_roles_user on user_roles(user_id);

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'first_name', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer') on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create or replace function has_role(_role app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = _role);
$$;
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role in ('staff','admin'));
$$;
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin');
$$;

-- ===========================================================================
-- MEDIA
-- ===========================================================================
create table if not exists media (
  id           uuid primary key default gen_random_uuid(),
  bucket       text not null,
  storage_path text not null,
  filename     text,
  mime_type    text,
  alt_text     text,
  caption      text,
  width        int,
  height       int,
  size_bytes   bigint,
  visibility   text not null default 'public',
  uploaded_by  uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (bucket, storage_path)
);

do $$ begin
  alter table profiles add constraint profiles_avatar_fk
    foreign key (avatar_media_id) references media(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- CATALOG
-- ===========================================================================
create table if not exists destinations (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  state         text,
  country       text not null default 'India',
  description   text,
  hero_media_id uuid references media(id) on delete set null,
  status        content_status not null default 'published',
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  kind       text not null default 'trek_group',
  blurb      text,
  position   int not null default 0,
  status     content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tags (
  id   uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text
);

create table if not exists treks (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  destination_id   uuid references destinations(id) on delete set null,
  category_id      uuid references categories(id) on delete set null,
  kind             text not null default 'trek',
  location         text,
  state            text,
  summary          text,
  about            text,
  difficulty       trek_difficulty,
  duration_label   text,
  days             smallint,
  nights           smallint,
  highest_altitude text,
  suitable_age     text,
  basecamp         text,
  accommodation    text,
  fitness_criteria text,
  base_price       bigint,
  currency         char(3) not null default 'INR',
  badge            text,
  rating           numeric(2,1),
  review_count     int not null default 0,
  hero_media_id    uuid references media(id) on delete set null,
  seo_title        text,
  meta_description text,
  canonical_url    text,
  og_title         text,
  og_description   text,
  og_image_media_id uuid references media(id) on delete set null,
  robots_noindex   boolean not null default false,
  schema_type      text,
  status           content_status not null default 'draft',
  published_at     timestamptz,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_treks_status_pub on treks(status, published_at);
create index if not exists idx_treks_category on treks(category_id);
create index if not exists idx_treks_destination on treks(destination_id);

create table if not exists trek_tags (
  trek_id uuid not null references treks(id) on delete cascade,
  tag_id  uuid not null references tags(id) on delete cascade,
  primary key (trek_id, tag_id)
);
create index if not exists idx_trek_tags_tag on trek_tags(tag_id);

create table if not exists trek_itinerary_days (
  id          uuid primary key default gen_random_uuid(),
  trek_id     uuid not null references treks(id) on delete cascade,
  day_number  smallint not null,
  title       text,
  description text,
  position    int not null default 0,
  unique (trek_id, day_number)
);

create table if not exists trek_itinerary_slots (
  id       uuid primary key default gen_random_uuid(),
  day_id   uuid not null references trek_itinerary_days(id) on delete cascade,
  time     text,
  activity text,
  position int not null default 0
);
create index if not exists idx_iti_slots_day on trek_itinerary_slots(day_id);

create table if not exists trek_addons (
  id         uuid primary key default gen_random_uuid(),
  trek_id    uuid references treks(id) on delete cascade,
  name       text not null,
  price      bigint not null,
  active     boolean not null default true,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trek_sections (
  id             uuid primary key default gen_random_uuid(),
  trek_id        uuid not null references treks(id) on delete cascade,
  section_key    text not null,
  component_type text,
  content        jsonb not null default '{}'::jsonb,
  position       int not null default 0,
  is_visible     boolean not null default true,
  unique (trek_id, section_key)
);

create table if not exists trek_media (
  trek_id  uuid not null references treks(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  role     text not null default 'gallery',
  position int not null default 0,
  primary key (trek_id, media_id, role)
);

-- ===========================================================================
-- SCHEDULES / AVAILABILITY
-- ===========================================================================
create table if not exists trek_departures (
  id             uuid primary key default gen_random_uuid(),
  trek_id        uuid not null references treks(id) on delete cascade,
  start_date     date not null,
  end_date       date,
  start_time     text,
  capacity       int not null check (capacity >= 0),
  booked_seats   int not null default 0 check (booked_seats >= 0),
  price_override bigint,
  booking_cutoff timestamptz,
  meeting_point  text,
  notes          text,
  status         departure_status not null default 'scheduled',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (booked_seats <= capacity)
);
create index if not exists idx_departures_trek_date on trek_departures(trek_id, start_date);
create index if not exists idx_departures_status_date on trek_departures(status, start_date);

-- ===========================================================================
-- BOOKINGS / TRAVELLERS / LOYALTY
-- ===========================================================================
create table if not exists bookings (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  user_id         uuid references profiles(id) on delete set null,
  draft_token     text,
  trek_id         uuid not null references treks(id),
  departure_id    uuid not null references trek_departures(id),
  status          booking_status not null default 'draft',
  adults          smallint not null default 1 check (adults >= 0),
  children        smallint not null default 0 check (children >= 0),
  seats           int generated always as (adults + children) stored,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  currency        char(3) not null default 'INR',
  price_adult     bigint not null default 0,
  price_child     bigint not null default 0,
  addons_total    bigint not null default 0,
  discount_amount bigint not null default 0,
  points_redeemed bigint not null default 0,
  subtotal        bigint not null default 0,
  tax_amount      bigint not null default 0,
  grand_total     bigint not null default 0,
  trek_title        text,
  departure_date    date,
  terms_snapshot    text,
  notes             text,
  expires_at        timestamptz,
  confirmed_at      timestamptz,
  cancelled_at      timestamptz,
  cancellation_reason text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_bookings_user on bookings(user_id, created_at desc);
create index if not exists idx_bookings_departure on bookings(departure_id);
create index if not exists idx_bookings_status on bookings(status);

create table if not exists booking_travellers (
  id                       uuid primary key default gen_random_uuid(),
  booking_id               uuid not null references bookings(id) on delete cascade,
  full_name                text not null,
  phone                    text,
  email                    text,
  date_of_birth            date,
  gender                   gender,
  is_lead                  boolean not null default false,
  emergency_contact_name   text,
  emergency_contact_phone  text,
  blood_group              text,
  medical_conditions       text,
  position                 int not null default 0
);
create index if not exists idx_travellers_booking on booking_travellers(booking_id);

create table if not exists booking_addons (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  addon_id   uuid references trek_addons(id) on delete set null,
  name       text not null,
  unit_price bigint not null,
  quantity   int not null check (quantity > 0),
  line_total bigint not null
);
create index if not exists idx_baddons_booking on booking_addons(booking_id);

create table if not exists points_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,
  points     bigint not null,
  type       points_txn_type not null,
  expires_at timestamptz,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_points_user on points_ledger(user_id);

create or replace function set_booking_reference() returns trigger
language plpgsql as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'AA-' || to_char(now(),'YYYY') || '-' ||
      upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 6));
  end if;
  return new;
end; $$;
drop trigger if exists trg_booking_reference on bookings;
create trigger trg_booking_reference before insert on bookings
  for each row execute function set_booking_reference();

create or replace function reserve_departure_seats(_departure_id uuid, _seats int)
returns int language plpgsql security definer set search_path = public as $$
declare _cap int; _booked int;
begin
  select capacity, booked_seats into _cap, _booked
    from trek_departures where id = _departure_id for update;
  if not found then raise exception 'departure % not found', _departure_id; end if;
  if _booked + _seats > _cap then
    raise exception 'not enough seats: % requested, % available', _seats, _cap - _booked
      using errcode = 'check_violation';
  end if;
  update trek_departures set booked_seats = booked_seats + _seats,
    status = case when booked_seats + _seats >= _cap then 'full'::departure_status else status end
    where id = _departure_id;
  return _booked + _seats;
end; $$;

create or replace function release_departure_seats(_departure_id uuid, _seats int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update trek_departures
    set booked_seats = greatest(0, booked_seats - _seats),
        status = case when status = 'full' then 'open'::departure_status else status end
    where id = _departure_id;
end; $$;

-- ===========================================================================
-- PAYMENTS
-- ===========================================================================
create table if not exists payments (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null references bookings(id),
  provider          text not null default 'phonepe',
  merchant_order_id text not null unique,
  provider_txn_id   text,
  amount            bigint not null,
  currency          char(3) not null default 'INR',
  status            payment_status not null default 'pending',
  method            text,
  idempotency_key   text unique,
  verified_at       timestamptz,
  failure_code      text,
  failure_message   text,
  raw_response      jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_payments_booking on payments(booking_id);
create index if not exists idx_payments_status on payments(status);

create table if not exists refunds (
  id                uuid primary key default gen_random_uuid(),
  payment_id        uuid not null references payments(id),
  amount            bigint not null,
  status            refund_status not null default 'pending',
  provider_refund_id text,
  reason            text,
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_refunds_payment on refunds(payment_id);

create table if not exists payment_webhook_events (
  id                 uuid primary key default gen_random_uuid(),
  provider           text not null,
  event_id           text not null,
  payload            jsonb,
  signature_verified boolean not null default false,
  processed_at       timestamptz,
  created_at         timestamptz not null default now(),
  unique (provider, event_id)
);

-- ===========================================================================
-- LEADS / CRM  (leads already exists from 0001_leads — extend it)
-- ===========================================================================
alter table leads add column if not exists trek_id     uuid references treks(id) on delete set null;
alter table leads add column if not exists assigned_to uuid references profiles(id) on delete set null;
alter table leads add column if not exists updated_at  timestamptz not null default now();
create index if not exists idx_leads_status on leads(status, created_at desc);
create index if not exists idx_leads_assigned on leads(assigned_to);

create table if not exists lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  author_id  uuid references profiles(id) on delete set null,
  note       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_notes_lead on lead_notes(lead_id);

-- ===========================================================================
-- CONTENT / CMS / MARKETING
-- ===========================================================================
create table if not exists testimonials (
  id              uuid primary key default gen_random_uuid(),
  author_name     text not null,
  role            text,
  rating          smallint check (rating between 1 and 5),
  body            text not null,
  avatar_media_id uuid references media(id) on delete set null,
  booking_id      uuid references bookings(id) on delete set null,
  status          content_status not null default 'published',
  position        int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  excerpt          text,
  body             text,
  cover_media_id   uuid references media(id) on delete set null,
  author_id        uuid references profiles(id) on delete set null,
  trek_id          uuid references treks(id) on delete set null,
  seo_title        text,
  meta_description text,
  og_image_media_id uuid references media(id) on delete set null,
  status           content_status not null default 'draft',
  published_at     timestamptz,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_posts_status_pub on posts(status, published_at);

create table if not exists pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  sections         jsonb not null default '[]'::jsonb,
  seo_title        text,
  meta_description text,
  status           content_status not null default 'draft',
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists partners (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo_media_id uuid references media(id) on delete set null,
  url           text,
  position      int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- NOTIFICATIONS (outbox) / AUDIT
-- ===========================================================================
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete set null,
  channel    notification_channel not null,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  status     notification_status not null default 'pending',
  sent_at    timestamptz,
  error      text,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_status on notifications(status, created_at);
create index if not exists idx_notifications_user on notifications(user_id);

create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_entity on audit_log(entity_type, entity_id);

create or replace function audit_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare _col text := tg_argv[0]; _val text;
begin
  if _col is not null then _val := to_jsonb(new) ->> _col; end if;
  insert into audit_log(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), tg_op, tg_table_name, new.id, jsonb_build_object(_col, _val));
  return new;
end; $$;

create or replace function audit_user_roles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), tg_op, 'user_roles', coalesce(new.user_id, old.user_id),
          jsonb_build_object('role', coalesce(new.role, old.role)));
  return coalesce(new, old);
end; $$;

drop trigger if exists trg_audit_bookings on bookings;
create trigger trg_audit_bookings after insert or update of status on bookings
  for each row execute function audit_change('status');
drop trigger if exists trg_audit_payments on payments;
create trigger trg_audit_payments after insert or update of status on payments
  for each row execute function audit_change('status');
drop trigger if exists trg_audit_refunds on refunds;
create trigger trg_audit_refunds after insert or update of status on refunds
  for each row execute function audit_change('status');
drop trigger if exists trg_audit_user_roles on user_roles;
create trigger trg_audit_user_roles after insert or delete on user_roles
  for each row execute function audit_user_roles();

-- ---------- updated_at triggers -------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','destinations','categories','treks','trek_addons','trek_departures',
    'bookings','payments','refunds','leads','testimonials','posts','pages','partners'
  ] loop
    execute format('drop trigger if exists t_upd on %I', t);
    execute format('create trigger t_upd before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;
