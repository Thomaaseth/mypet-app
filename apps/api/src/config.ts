import type { MigrationConfig } from "drizzle-orm/migrator";

function envOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}

type Config = {
    api: {
        port: number;
        baseUrl: string;
    };
    db: {
        url: string;
        migrationConfig: MigrationConfig;
    };
    auth: {
        secret: string;
        url: string;
    };
    email: {
        resendApiKey: string;
        // fromAddress: string;
    };
    app: {
        url: string;
    };
};

const migrationConfig: MigrationConfig = {
    migrationsFolder: "./src/db/migrations"
}

export const config: Config = {
    api: {
        port: Number(envOrThrow("PORT")),
        baseUrl: envOrThrow("API_BASE_URL")
    },
    db: {
        url: envOrThrow("DATABASE_URL"),
        migrationConfig: migrationConfig
    },
    auth: {
        secret: envOrThrow("BETTER_AUTH_SECRET"),
        url: envOrThrow("BETTER_AUTH_URL")
    },
    email: {
        resendApiKey: envOrThrow("RESEND_API_KEY"),
        // fromAddress: process.env.EMAIL_FROM_ADDRESS || "Pettr <noreply@pettr.com>"
    },
    app: {
        url: process.env.APP_URL || "http://localhost:3000"
    }
}
