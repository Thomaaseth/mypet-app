import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from './schema';
import { config } from '../config';

const client = postgres(config.db.url, {
  max: 1, // Supabase pooler recommendation
  idle_timeout: 0, // Let pooler handle idle connections
  connect_timeout: 10,
  
  connection: {
    application_name: 'mypet-app',
  },
  
  transform: {
    undefined: null,
  },
});

// Test connection on startup
client`SELECT 1`
  .then(() => console.log('[DB] ✅ Database connection established'))
  .catch((error) => console.error('[DB] ❌ Failed to connect:', error.message));

export const db = drizzle(client, { schema });

export * from './schema'