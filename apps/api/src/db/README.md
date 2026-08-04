# Database: schema & migrations

Drizzle (`drizzle-orm` + `drizzle-kit`) over Supabase Postgres. Schema lives in
`schema/`, generated SQL migrations in `migrations/`.

## Everyday workflow

1. Edit the schema in `schema/*.ts`.
2. Generate a migration: `bun run db:generate`
3. **Read the generated SQL before applying.** It should contain only the change
   you intended — no unexpected `DROP`s, renames, or type changes. If it does,
   the snapshot drifted; stop and investigate.
4. Apply it: `bun run db:migrate + bun run test:db:migrate`

Migrations run against whatever `DATABASE_URL` + `APP_ENV` resolve to. The guard
in `src/config/database-identity.ts` refuses to run against the wrong project,
so a mismatched env fails fast rather than migrating the wrong database. Apply to
staging first; prod inherits the same migration files in sequence.

## RLS convention — REQUIRED for every new table

Row Level Security is **not** modeled in the Drizzle schema, so `drizzle-kit
generate` will never emit it. Every new table in the `public` schema must have
RLS enabled by hand, in its own custom migration:

    bunx drizzle-kit generate --custom --name=enable_rls_<table>

    ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;

- Use `ENABLE`, **never** `FORCE` — `FORCE` gates the owner too and would lock
  out the app.
- `ENABLE ROW LEVEL SECURITY` is idempotent; re-running is a harmless no-op.
- Verify after applying:

      SELECT relname, relrowsecurity FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
      ORDER BY relname;

  Every table should show `relrowsecurity = true`.

## Unique constraints on existing data

Adding a `UNIQUE` / `uniqueIndex` **fails** if the target rows already contain
duplicates. Before applying one against a database that holds real data, check
first and resolve any duplicates:

    SELECT <cols>, COUNT(*) FROM <table> GROUP BY <cols> HAVING COUNT(*) > 1;