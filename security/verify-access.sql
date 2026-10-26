-- Read-only inventory. Run before re-enabling any database-backed public UI.
BEGIN READ ONLY;
SELECT n.nspname AS schema, c.relname AS relation, c.relkind, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m');
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public';
SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','PUBLIC');
SELECT n.nspname, p.proname, p.prosecdef, p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public';
ROLLBACK;
-- Inventory alone is not proof. Review every exposed schema, view and RPC;
-- test anon and ordinary authenticated access with synthetic records.
-- Private requests/claims must have no public read or mutation path.
-- Authorize administrators using server-controlled roles, never user_metadata.
