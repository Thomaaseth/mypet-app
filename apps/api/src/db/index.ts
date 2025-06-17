import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
    throw new Error('Database url is not set');
}

const client = postgres(connectionString);
export const db = drizzle(client);

export * from './schema'