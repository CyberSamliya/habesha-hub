-- Family Hub lesson uploads for the "Habesha Hub" Supabase project (habeshahubusa.com).
-- Members can view uploaded lessons; only admins can upload or delete.
-- "Admin" reuses the project's existing rule, app_private.is_admin():
-- a profile with role = 'admin' and status = 'active'.
-- To make someone an admin: update public.profiles set role = 'admin', status = 'active' where id = '<user uuid>';

-- Signed-in users must be able to evaluate is_admin() inside access rules.
-- app_private is not exposed through the API; is_admin() only reports on the caller.
grant usage on schema app_private to authenticated;
revoke execute on function app_private.is_admin() from public, anon;
grant execute on function app_private.is_admin() to authenticated;

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
  with check (created_by = (select auth.uid()) and (select app_private.is_admin()));
create policy "Admins can delete lesson uploads" on public.lesson_uploads
  for delete to authenticated
  using ((select app_private.is_admin()));
-- Least privilege: Supabase's default grants give anon and authenticated every privilege
-- on new public tables, so reset them and grant only what the page needs.
revoke all on public.lesson_uploads from anon, authenticated;
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
  with check (bucket_id = 'lessons' and (select app_private.is_admin()));
-- Removing a file needs SELECT as well as DELETE on storage.objects.
create policy "Admins can read lesson file records" on storage.objects
  for select to authenticated
  using (bucket_id = 'lessons' and (select app_private.is_admin()));
create policy "Admins can delete lesson files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lessons' and (select app_private.is_admin()));
