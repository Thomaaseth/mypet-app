'use client'

import { z } from 'zod';

// Runtime validation schema for environment variables
const configSchema = z.object({
  app: z.object({
    url: z.string().url('APP_URL must be a valid URL'),
    baseUrl: z.string().url('APP_URL must be a valid URL'),
    isDevelopment: z.boolean(),
    isProduction: z.boolean(),
    isTest: z.boolean(),
  }),
  api: z.object({
    baseUrl: z.string().url('API_URL must be a valid URL'),
  }),
  auth: z.object({
    callbackBaseUrl: z.string().url('APP_URL must be a valid URL'),
  }),
});

type WebConfig = z.infer<typeof configSchema>;

// Cache the validated config
let cachedConfig: WebConfig | null = null;

export const getConfig = (): WebConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const rawConfig = {
    app: {
      url: appUrl,
      baseUrl: appUrl,
      isDevelopment: nodeEnv === 'development',
      isProduction: nodeEnv === 'production',
      isTest: nodeEnv === 'test',
    },
    api: {
      baseUrl: apiUrl,
    },
    auth: {
      callbackBaseUrl: appUrl,
    },
  };

  try {
    // Validate configuration at runtime
    cachedConfig = configSchema.parse(rawConfig);
    
    if (cachedConfig.app.isDevelopment) {
      console.log('🔧 Config loaded and validated:', {
        NODE_ENV: nodeEnv,
        appUrl: cachedConfig.app.url,
        apiUrl: cachedConfig.api.baseUrl,
      });
    }

    return cachedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid configuration:', error.errors);
      throw new Error(`Configuration validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
};

// Helper functions for common config checks
export const isDevelopment = () => getConfig().app.isDevelopment;
export const isProduction = () => getConfig().app.isProduction;
export const getApiUrl = () => getConfig().api.baseUrl;
export const getAppUrl = () => getConfig().app.url;