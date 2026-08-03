import { defineConfig } from 'drizzle-kit'
import { resolveDatabaseUrl } from './src/config/database-identity'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
})