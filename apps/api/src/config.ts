import type { MigrationConfig } from "drizzle-orm/migrator";
import { getConfig } from "@/shared/config/config";
import { getTestDatabaseUrl } from "./lib/get-test-database-url";

function envOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}

export function getDatabaseUrl(): string {
    const isTest = process.env.NODE_ENV === 'test';
    if (isTest) {
        return getTestDatabaseUrl();
    }
    return envOrThrow("DATABASE_URL");
}

// // Helper to get database URL with test support
// export function getDatabaseUrl(): string {
//     const isTest = process.env.NODE_ENV === 'test';
    
//     if (isTest) {
//         const url = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/pettr_test';
//         const parsed = new URL(url);
//         const hostname = parsed.hostname;
//         // pathname must be like "/pettr_test" —
//         const databaseName = parsed.pathname.replace(/^\//, '');
//         // SAFETY GUARD 
//         // Two independent checks, both required:
//         //   1. Host must be localhost/127.0.0.1 — never a remote host,
//         //      never a tunnel/port-forward exposing a remote DB as local.
//         //   2. Database NAME must end in "_test" — protects against a real/
//         //      important local database also running on port 5432. Never
//         //      point TEST_DATABASE_URL at a database you care about, even
//         //      locally, even under a plausible-looking name.
//         if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
//             throw new Error(`Refusing to run tests against non-local host "${hostname}"`);
//         }
//         if (!databaseName.endsWith('_test')) {
//             throw new Error(
//                 `Refusing to run tests against database "${databaseName}" — ` +
//                 `test database names must end in "_test".`
//             );
//         }
//         return url;
//     }
//     // In non-test environments, DATABASE_URL is required
//     return envOrThrow("DATABASE_URL");
// }

// Helper to get required env vars with test fallbacks
function getRequiredEnv(key: string, testFallback?: string): string {
    const isTest = process.env.NODE_ENV === 'test';
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
        return envOrThrow(key);
    }
    
    if (isTest && testFallback) {
        return process.env[key] || testFallback;
    }
    
    return envOrThrow(key);
}

const envConfig = getConfig();

type Config = {
    env: {
        port: number;
        apiUrl: string;
        webUrl: string;
        cookieDomain: string | undefined;
    };
    db: {
        url: string;
        migrationConfig: MigrationConfig;
    };
    auth: {
        secret: string;
    };
    email: {
        resendApiKey: string;
    };
};

const migrationConfig: MigrationConfig = {
    migrationsFolder: "./src/db/migrations"
}

export const config: Config = {
    env: {
        port: envConfig.API_PORT,
        apiUrl: envConfig.API_URL,
        webUrl: envConfig.WEB_URL,
        cookieDomain: process.env.COOKIE_DOMAIN,
    },
    db: {
        url: getDatabaseUrl(),
        migrationConfig: migrationConfig
    },
    auth: {
        secret: getRequiredEnv("BETTER_AUTH_SECRET", "test-secret-key"),
    },
    email: {
        resendApiKey: getRequiredEnv("RESEND_API_KEY", "test-resend-key"),
    }
}