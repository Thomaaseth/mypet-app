import { getEnvironment } from '@/shared/config/config';

// APP_ENV is the *deployment identity* axis, orthogonal to NODE_ENV.
// Both staging and prod run with NODE_ENV=production (twelve-factor dev/prod
// parity), so NODE_ENV alone cannot tell them apart. That is APP_ENV's job.
const APP_ENVS = ['development', 'staging', 'production', 'test'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

function isAppEnv(value: string): value is AppEnv {
  return (APP_ENVS as readonly string[]).includes(value);
}

function resolveAppEnv(): AppEnv {
  const raw = process.env.APP_ENV;
  const nodeEnv = getEnvironment(); // 'development' | 'production' | 'test'

  // On a deployed stage, APP_ENV MUST be set explicitly and MUST name a real
  // deployment. We never infer staging-vs-production.
  if (nodeEnv === 'production') {
    if (!raw) {
      throw new Error(
        "APP_ENV is not set. With NODE_ENV=production it must be explicitly " +
        "'staging' or 'production'.",
      );
    }
    if (raw !== 'staging' && raw !== 'production') {
      throw new Error(
        `APP_ENV="${raw}" is invalid with NODE_ENV=production; ` +
        "expected 'staging' or 'production'.",
      );
    }
    return raw;
  }

  // Local dev / tests: honor an explicit, valid APP_ENV (rejecting typos so a
  // misspelling never silently degrades to a default), otherwise derive it.
  if (raw !== undefined) {
    if (!isAppEnv(raw)) {
      throw new Error(
        `APP_ENV="${raw}" is not a recognized value ` +
        `(expected one of: ${APP_ENVS.join(', ')}).`,
      );
    }
    return raw;
  }

  return nodeEnv === 'test' ? 'test' : 'development';
}

// Resolved once at module load, matching the existing config.ts pattern.
export const APP_ENV: AppEnv = resolveAppEnv();