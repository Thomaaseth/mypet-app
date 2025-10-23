import { z } from 'zod'

const envSchema = z.object({
  MODE: z.enum(['development', 'production', 'test']),
  DEV: z.boolean(),
  PROD: z.boolean(),
  VITE_API_URL: z.string().url().optional(),
  VITE_WEB_URL: z.string().url().optional(),
})

// Parse and validate environment variables
// Provide defaults for test environment
const rawEnv = {
  MODE: import.meta.env.MODE || 'test',
  DEV: import.meta.env.DEV ?? false,
  PROD: import.meta.env.PROD ?? false,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WEB_URL: import.meta.env.VITE_WEB_URL,
}

const env = envSchema.parse(rawEnv)
// Default values
const API_URL = env.VITE_API_URL || 'http://localhost:3001'
const WEB_URL = env.VITE_WEB_URL || 'http://localhost:3000'

export const config = {
  app: {
    url: WEB_URL,
    isDevelopment: env.DEV,
    isProduction: env.PROD,
    isTest: env.MODE === 'test',
  },
  api: {
    baseUrl: API_URL,
  },
} as const

export const isDevelopment = () => config.app.isDevelopment
export const isProduction = () => config.app.isProduction
export const getApiUrl = () => config.api.baseUrl
export const getAppUrl = () => config.app.url