import type { MigrationConfig } from "drizzle-orm/migrator";
import { getConfig } from "@/shared/config/config";
import { resolveDatabaseUrl } from "./config/database-identity";

function envOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}

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
        fromAddress: string;
        replyTo: string | undefined;
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
        url: resolveDatabaseUrl(),
        migrationConfig: migrationConfig
    },
    auth: {
        secret: getRequiredEnv("BETTER_AUTH_SECRET", "test-secret-key"),
    },
    email: {
        resendApiKey: getRequiredEnv("RESEND_API_KEY", "test-resend-key"),
        fromAddress: getRequiredEnv("EMAIL_FROM_ADDRESS", "Pettr <onboarding@resend.dev>"),
        replyTo: process.env.EMAIL_REPLY_TO,
    }
}