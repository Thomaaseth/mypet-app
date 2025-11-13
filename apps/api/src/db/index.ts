import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from './schema'
import { config } from '../config'


const client = postgres(config.db.url, {
    max: 10, // Connection pool size
    idle_timeout: 120, // Close idle connections after 120s
    connect_timeout: 10, // Timeout for establishing connection
    max_lifetime: 60 * 15, // Max connection lifetime: 15 minutes
    
    // DIAGNOSTIC LOGGING (helps us see what's happening)
    onnotice: (notice) => {
      console.log('[DB NOTICE]', notice);
    },
    
    onclose: (connection_id) => {
        console.log('[DB] Connection closed:', connection_id, 'at', new Date().toISOString());
    },
    
    // Connection error handling
    connection: {
      application_name: 'mypet-app',
    },
    
    // Better timeout handling - exponential backoff for retries
    backoff: (attempt) => {
      const backoffTime = Math.min(1000 * 2 ** attempt, 10000);
      console.log(`[DB] Retry attempt ${attempt}, waiting ${backoffTime}ms at`, new Date().toISOString());
      return backoffTime;
    },
    
    // Transform undefined to null for postgres
    transform: {
      undefined: null,
    },
  });
  
  // Log successful connection on startup
  client`SELECT 1`.then(() => {
    console.log('[DB] ✅ Database connection established');
  }).catch((error) => {
    console.error('[DB] ❌ Failed to connect to database:', error.message);
  });
  



export const db = drizzle(client, { schema });

export * from './schema'