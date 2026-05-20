-- ============================================================
-- Woodshed — run this once in the Supabase SQL Editor
-- ============================================================

-- Profiles (one row per band member, linked to auth.users)
create table public.profiles (
  id      uuid references auth.users on delete cascade primary key,
  name    text not null,
  color   text not null default '#2563eb',
  created_at timestamptz default now() not null
);

-- Songs
create table public.songs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  stage       text not null default 'idea'
                check (stage in ('idea','lyrics','demo','produced','done')),
  key         text,
  bpm         integer,
  notes       text default '',
  lyrics      text default '',
  tags        text[] default '{}',
  created_by  uuid references public.profiles(id) not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Files attached to songs
create table public.song_files (
  id           uuid primary key default gen_random_uuid(),
  song_id      uuid references public.songs(id) on delete cascade not null,
  name         text not null,
  type         text not null,
  size_bytes   bigint not null,
  storage_path text not null,
  added_by     uuid references public.profiles(id) not null,
  added_at     timestamptz default now() not null
);

-- Activity log
create table public.song_activity (
  id         uuid primary key default gen_random_uuid(),
  song_id    uuid references public.songs(id) on delete cascade not null,
  member_id  uuid references public.profiles(id) not null,
  action     text not null,
  created_at timestamptz default now() not null
);

-- ── Auto-update updated_at on songs ──────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger songs_updated_at
  before update on public.songs
  for each row execute function public.handle_updated_at();

-- ── Table access grants ───────────────────────────────────────
-- RLS controls row-level access, but the role still needs basic
-- table-level permission to get past Postgres's first check.
grant select, insert, update, delete on public.profiles      to authenticated;
grant select, insert, update, delete on public.songs         to authenticated;
grant select, insert, update, delete on public.song_files    to authenticated;
grant select, insert, update, delete on public.song_activity to authenticated;

-- ── Row Level Security ────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.songs        enable row level security;
alter table public.song_files   enable row level security;
alter table public.song_activity enable row level security;

-- Profiles
create policy "members can read all profiles"
  on public.profiles for select to authenticated using (true);
create policy "members can create their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "members can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Songs
create policy "members can read all songs"
  on public.songs for select to authenticated using (true);
create policy "members can create songs"
  on public.songs for insert to authenticated with check (auth.uid() = created_by);
create policy "members can update any song"
  on public.songs for update to authenticated using (true);
create policy "creator can delete song"
  on public.songs for delete to authenticated using (auth.uid() = created_by);

-- Files
create policy "members can read all files"
  on public.song_files for select to authenticated using (true);
create policy "members can upload files"
  on public.song_files for insert to authenticated with check (auth.uid() = added_by);
create policy "uploader can delete file"
  on public.song_files for delete to authenticated using (auth.uid() = added_by);

-- Activity
create policy "members can read all activity"
  on public.song_activity for select to authenticated using (true);
create policy "members can log activity"
  on public.song_activity for insert to authenticated with check (auth.uid() = member_id);

-- ── Storage bucket ────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('song-files', 'song-files', false)
  on conflict do nothing;

create policy "members can upload to song-files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'song-files');

create policy "members can read song-files"
  on storage.objects for select to authenticated
  using (bucket_id = 'song-files');

create policy "uploader can delete from song-files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'song-files');
