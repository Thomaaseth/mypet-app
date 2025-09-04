import type { MigrationConfig } from "drizzle-orm/migrator";
// import { getConfig } from "@/shared/config/config";
import { getConfig } from "../../../packages/shared/src/config/config";

function envOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}

// Helper to get database URL with test support
function getDatabaseUrl(): string {
    const isTest = process.env.NODE_ENV === 'test';
    
    if (isTest) {
        // In tests, allow TEST_DATABASE_URL or fallback to test database
        return process.env.TEST_DATABASE_URL || 
               process.env.DATABASE_URL?.replace('/pettr', '/pettr_test') ||
               'postgresql://localhost:5432/pettr_test';
    }
    
    // In non-test environments, DATABASE_URL is required
    return envOrThrow("DATABASE_URL");
}

// Helper to get required env vars with test fallbacks
function getRequiredEnv(key: string, testFallback?: string): string {
    const isTest = process.env.NODE_ENV === 'test';
    
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