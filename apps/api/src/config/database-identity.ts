import { APP_ENV } from './app-env';
import { getTestDatabaseUrl } from '@/lib/get-test-database-url';

// This map is the pinned identity the guard checks DATABASE_URL against,
// so a deployment can only ever talk to the database its APP_ENV is allowed touse
const EXPECTED_PROJECT_REF = {
  staging: 'lntrknuxlsgyqqnphsph',
  production: 'fhlujpwuundtwolfrjjq',
} as const satisfies Record<'staging' | 'production', string>;

// Extracts the Supabase project ref from a connection string, handling both
// connection shapes so switching between pooler and direct never breaks the
// guard:
//   - Supavisor pooler: username is `<user>.<ref>` (postgres.<ref>)
//   - Direct connection: host is `db.<ref>.supabase.co`
// Returns null for non-Supabase URLs (local postgres used in dev).
export function extractSupabaseRef(databaseUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return null;
  }

  // Pooler: ref is everything after the first dot in the username.
  const username = decodeURIComponent(parsed.username);
  const dotIndex = username.indexOf('.');
  if (dotIndex !== -1) {
    const ref = username.slice(dotIndex + 1);
    if (ref.length > 0) return ref;
  }

  // Direct: ref is the label between `db.` and `.supabase.co`.
  const directMatch = /^db\.([a-z0-9]+)\.supabase\.co$/.exec(parsed.hostname);
  if (directMatch) return directMatch[1];

  return null;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set.');
  }
  return url;
}

// The single guarded entry point for the database URL. Every consumer — the app
// config AND drizzle-kit migrations — resolves the URL through here, so the
// identity check protects both runtime and the highest-risk operation (migrations).
export function resolveDatabaseUrl(): string {
  // Tests: delegate to the existing localhost + `_test` guard.
  if (APP_ENV === 'test') {
    return getTestDatabaseUrl();
  }

  const url = requireDatabaseUrl();
  const ref = extractSupabaseRef(url);

  // Deployed stages: the DB ref MUST match the one pinned for this APP_ENV.
  if (APP_ENV === 'staging' || APP_ENV === 'production') {
    const expected = EXPECTED_PROJECT_REF[APP_ENV];
    if (ref !== expected) {
      throw new Error(
        `DATABASE_URL points at Supabase project "${ref ?? 'unknown'}", but ` +
        `APP_ENV="${APP_ENV}" requires project "${expected}". Refusing to ` +
        `start to avoid crossing environments.`,
      );
    }
    return url;
  }

  // Development: allow anything EXCEPT the production database — so a local
  // `bun run dev` (which runs migrations on boot) can never touch prod.
  if (ref === EXPECTED_PROJECT_REF.production) {
    throw new Error(
      'DATABASE_URL points at the PRODUCTION Supabase project while ' +
      'APP_ENV="development". Refusing to run local/dev against production.',
    );
  }
  return url;
}