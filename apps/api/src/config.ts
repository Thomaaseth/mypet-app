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
        url: envOrThrow("DATABASE_URL"),
        migrationConfig: migrationConfig
    },
    auth: {
        secret: envOrThrow("BETTER_AUTH_SECRET"),
    },
    email: {
        resendApiKey: envOrThrow("RESEND_API_KEY"),
    }
}