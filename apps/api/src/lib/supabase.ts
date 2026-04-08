import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

export const storageLogger = logger.child({ module: 'storage' });

// Storage constants
export const STORAGE_BUCKET = 'pet-images' as const;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

function getSupabaseEnv(key: string, testFallback: string): string {
  const isTest = process.env.NODE_ENV === 'test';
  const value = process.env[key];

  if (value) return value;
  if (isTest) return testFallback;

  throw new Error(`Environment variable ${key} is not set`);
}

const supabaseUrl = getSupabaseEnv('SUPABASE_URL', 'http://localhost:54321');
const supabaseServiceRoleKey = getSupabaseEnv(
  'SUPABASE_SERVICE_ROLE_KEY',
  'test-service-role-key'
);

// Singleton Supabase client — service role key bypasses RLS intentionally.
// Authorization is enforced at the Express middleware layer, not storage level.
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Disable auto-refresh and session persistence — this is a server-side client
    autoRefreshToken: false,
    persistSession: false,
  },
});

storageLogger.info('Supabase storage client initialized');