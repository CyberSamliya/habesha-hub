-- Family Hub lesson uploads for the "Habesha Hub" Supabase project (habeshahubusa.com).
-- Members can view uploaded lessons; only people listed in lesson_admins can upload or delete.

-- Who may upload lessons. Add an admin after creating their login in
-- Authentication > Users:  insert into public.lesson_admins (user_id) values ('<user uuid>');
create table if not exists public.lesson_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.lesson_admins enable row level security;
-- An admin can see their own row (the page uses this to show the upload form).
create policy "Admins can read their own admin row" on public.lesson_admins
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.lesson_admins to authenticated;

-- Uploaded lesson materials, one row per file or link, attached to Part 1 to 10.
create table if not exists public.lesson_uploads (
  id bigint generated always as identity primary key,
  part smallint not null check (part between 1 and 10),
  title text not null check (char_length(title) between 1 and 200),
  kind text not null check (kind in ('pdf', 'audio', 'video', 'image', 'document', 'link')),
  file_path text,
  url text not null check (url ~ '^https://'),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists lesson_uploads_part_idx on public.lesson_uploads (part);
create index if not exists lesson_uploads_created_by_idx on public.lesson_uploads (created_by);
alter table public.lesson_uploads enable row level security;

create policy "Anyone can view lesson uploads" on public.lesson_uploads
  for select to anon, authenticated using (true);
create policy "Admins can add lesson uploads" on public.lesson_uploads
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.lesson_admins a where a.user_id = (select auth.uid()))
  );
create policy "Admins can delete lesson uploads" on public.lesson_uploads
  for delete to authenticated
  using (exists (select 1 from public.lesson_admins a where a.user_id = (select auth.uid())));
grant select on public.lesson_uploads to anon, authenticated;
grant insert, delete on public.lesson_uploads to authenticated;

-- File storage: a public bucket (files are readable by URL, not listable), 50 MB per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lessons', 'lessons', true, 52428800, array[
  'application/pdf', 'audio/*', 'video/*', 'image/*',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do nothing;

create policy "Admins can upload lesson files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'lessons'
    and exists (select 1 from public.lesson_admins a where a.user_id = (select auth.uid()))
  );
-- Removing a file needs SELECT as well as DELETE on storage.objects.
create policy "Admins can read lesson file records" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'lessons'
    and exists (select 1 from public.lesson_admins a where a.user_id = (select auth.uid()))
  );
create policy "Admins can delete lesson files" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'lessons'
    and exists (select 1 from public.lesson_admins a where a.user_id = (select auth.uid()))
  );
