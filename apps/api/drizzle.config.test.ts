import { defineConfig } from 'drizzle-kit';
import { getTestDatabaseUrl } from './src/lib/get-test-database-url'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: getTestDatabaseUrl(),
},
});