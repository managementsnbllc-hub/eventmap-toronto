-- ═══════════════════════════════════════════════════════════
-- EventMap Toronto — Database Schema (Supabase / PostgreSQL)
-- Run this in the Supabase SQL Editor to bootstrap the DB.
-- ═══════════════════════════════════════════════════════════

-- Enable PostGIS for geo queries
create extension if not exists postgis;

-- ───────────────────────────────────
-- 1. PROFILES (extends Supabase auth.users)
-- ───────────────────────────────────
create table public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  phone         text unique,
  display_name  text not null default 'EventMap User',
  avatar_url    text,
  bio           text,
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone, display_name)
  values (new.id, new.phone, coalesce(new.raw_user_meta_data->>'display_name', 'EventMap User'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────
-- 2. EVENTS
-- ───────────────────────────────────
create type event_mode as enum ('in_person', 'online', 'hybrid');
create type event_status as enum ('draft', 'published', 'cancelled', 'removed');

create table public.events (
  id                uuid primary key default gen_random_uuid(),
  creator_id        uuid references public.profiles(id) on delete set null,
  title             text not null check (char_length(title) <= 120),
  description       text not null,
  category          text not null check (category in (
    'music','food','sports','art','community','nightlife','tech','wellness','other'
  )),
  event_mode        event_mode not null default 'in_person',
  status            event_status not null default 'published',

  -- Location (nullable for online-only)
  venue_name        text,
  address_text      text,
  location          geography(Point, 4326),  -- PostGIS point
  latitude          double precision,
  longitude         double precision,

  -- Online details
  online_link       text,
  online_platform   text check (online_platform in ('zoom','meet','teams','twitch','other', null)),
  online_instructions text,

  -- Timing
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  timezone          text not null default 'America/Toronto',

  -- Media
  cover_image_url   text,

  -- Price
  price_text        text not null default 'Free',

  -- Recurrence
  is_recurring      boolean not null default false,
  rrule             text,             -- iCal RRULE string
  recurrence_end    date,             -- hard cutoff (max 90 days)

  -- Denormalized counters (updated by triggers)
  save_count        int not null default 0,
  share_count       int not null default 0,
  avg_rating        numeric(2,1),
  rating_count      int not null default 0,

  -- Timestamps
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint valid_times check (ends_at > starts_at),
  constraint recurring_has_end check (
    (is_recurring = false) or (recurrence_end is not null)
  )
);

-- Geo column auto-sync trigger
create or replace function public.sync_event_location()
returns trigger as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;
  else
    new.location := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger event_location_sync
  before insert or update on public.events
  for each row execute function public.sync_event_location();

-- Indexes
create index idx_events_starts_at on public.events (starts_at);
create index idx_events_category on public.events (category);
create index idx_events_status on public.events (status);
create index idx_events_creator on public.events (creator_id);
create index idx_events_location on public.events using gist (location);

-- ───────────────────────────────────
-- 3. SAVED EVENTS
-- ───────────────────────────────────
create table public.saved_events (
  user_id    uuid references public.profiles(id) on delete cascade,
  event_id   uuid references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- Update save_count on events
create or replace function public.update_save_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.events set save_count = save_count + 1 where id = new.event_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.events set save_count = save_count - 1 where id = old.event_id;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_save_change
  after insert or delete on public.saved_events
  for each row execute function public.update_save_count();

-- ───────────────────────────────────
-- 4. RATINGS
-- ───────────────────────────────────
create table public.ratings (
  user_id    uuid references public.profiles(id) on delete cascade,
  event_id   uuid references public.events(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- Update avg_rating + rating_count on events
create or replace function public.update_rating_stats()
returns trigger as $$
begin
  update public.events set
    avg_rating = (select round(avg(stars)::numeric, 1) from public.ratings where event_id = coalesce(new.event_id, old.event_id)),
    rating_count = (select count(*) from public.ratings where event_id = coalesce(new.event_id, old.event_id))
  where id = coalesce(new.event_id, old.event_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_rating_change
  after insert or update or delete on public.ratings
  for each row execute function public.update_rating_stats();

-- ───────────────────────────────────
-- 5. SHARES (tracking only)
-- ───────────────────────────────────
create table public.shares (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  event_id   uuid references public.events(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.update_share_count()
returns trigger as $$
begin
  update public.events set share_count = share_count + 1 where id = new.event_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_share_insert
  after insert on public.shares
  for each row execute function public.update_share_count();

-- ───────────────────────────────────
-- 6. REPORTS
-- ───────────────────────────────────
create type report_reason as enum (
  'spam', 'offensive', 'misleading', 'duplicate', 'wrong_info', 'other'
);

create table public.reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  event_id   uuid references public.events(id) on delete cascade,
  reason     report_reason not null default 'other',
  details    text,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────────────────────────────
-- 7. NOTIFICATION PREFERENCES
-- ───────────────────────────────────
create table public.notification_prefs (
  user_id           uuid references public.profiles(id) on delete cascade primary key,
  push_enabled      boolean not null default true,
  saved_event_reminders boolean not null default true,
  new_events_nearby boolean not null default true,
  category_alerts   text[] not null default '{}',
  radius_km         int not null default 5,
  updated_at        timestamptz not null default now()
);

-- ───────────────────────────────────
-- 8. ROW LEVEL SECURITY
-- ───────────────────────────────────

-- Profiles
alter table public.profiles enable row level security;

create policy "Public profiles viewable by all"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Events
alter table public.events enable row level security;

create policy "Published events viewable by all"
  on public.events for select using (status = 'published');

create policy "Authenticated users can create events"
  on public.events for insert with check (auth.uid() = creator_id);

create policy "Creators can update own events"
  on public.events for update using (auth.uid() = creator_id);

create policy "Creators can delete own events"
  on public.events for delete using (auth.uid() = creator_id);

-- Saved events
alter table public.saved_events enable row level security;

create policy "Users can view own saves"
  on public.saved_events for select using (auth.uid() = user_id);

create policy "Users can save events"
  on public.saved_events for insert with check (auth.uid() = user_id);

create policy "Users can unsave events"
  on public.saved_events for delete using (auth.uid() = user_id);

-- Ratings
alter table public.ratings enable row level security;

create policy "Ratings viewable by all"
  on public.ratings for select using (true);

create policy "Users can rate"
  on public.ratings for insert with check (auth.uid() = user_id);

create policy "Users can update own rating"
  on public.ratings for update using (auth.uid() = user_id);

-- Shares
alter table public.shares enable row level security;

create policy "Users can log shares"
  on public.shares for insert with check (auth.uid() = user_id);

-- Reports
alter table public.reports enable row level security;

create policy "Users can submit reports"
  on public.reports for insert with check (auth.uid() = user_id);

create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = user_id);

-- Notification prefs
alter table public.notification_prefs enable row level security;

create policy "Users can manage own prefs"
  on public.notification_prefs for all using (auth.uid() = user_id);

-- ───────────────────────────────────
-- 9. USEFUL VIEWS
-- ───────────────────────────────────

-- Events with creator info (most common query)
create or replace view public.events_with_creator as
select
  e.*,
  p.display_name as creator_name,
  p.avatar_url as creator_avatar
from public.events e
left join public.profiles p on e.creator_id = p.id
where e.status = 'published';

-- ───────────────────────────────────
-- 10. HELPER FUNCTIONS
-- ───────────────────────────────────

-- Get nearby events within radius (km)
create or replace function public.get_nearby_events(
  lat double precision,
  lng double precision,
  radius_km double precision default 10,
  category_filter text default null,
  from_date timestamptz default now(),
  to_date timestamptz default now() + interval '7 days'
)
returns setof public.events_with_creator as $$
  select *
  from public.events_with_creator
  where
    starts_at between from_date and to_date
    and (
      location is null  -- include online events
      or st_dwithin(location, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_km * 1000)
    )
    and (category_filter is null or category = category_filter)
  order by starts_at asc;
$$ language sql stable;
