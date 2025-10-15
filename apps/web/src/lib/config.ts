// 'use client'

// import { z } from 'zod';
// import { getConfig } from "@/shared/config/config";

// const configSchema = z.object({
//   app: z.object({
//     url: z.string().url(),
//     isDevelopment: z.boolean(),
//     isProduction: z.boolean(),
//     isTest: z.boolean(),
//   }),
//   api: z.object({
//     baseUrl: z.string().url(),
//   }),
// });

// type WebConfig = z.infer<typeof configSchema>;

// let cachedConfig: WebConfig | null = null;

// export const getWebConfig = (): WebConfig => {
//   if (cachedConfig) {
//     return cachedConfig;
//   }

//   const nodeEnv = process.env.NODE_ENV || 'development';
//   const envConfig = getConfig();

//   const rawConfig = {
//     app: {
//       url: envConfig.WEB_URL,
//       isDevelopment: nodeEnv === 'development',
//       isProduction: nodeEnv === 'production',
//       isTest: nodeEnv === 'test',
//     },
//     api: {
//       baseUrl: envConfig.API_URL,
//     },
//   };

//   try {
//     cachedConfig = configSchema.parse(rawConfig);
    
//     if (cachedConfig.app.isDevelopment) {
//       console.log('🔧 Config loaded and validated:', {
//       });
//     }

//     return cachedConfig;
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       console.error('❌ Invalid configuration:', error.errors);
//       throw new Error(`Configuration validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
//     }
//     throw error;
//   }
// };

// export const isDevelopment = () => getWebConfig().app.isDevelopment;
// export const isProduction = () => getWebConfig().app.isProduction;
// export const getApiUrl = () => getWebConfig().api.baseUrl;
// export const getAppUrl = () => getWebConfig().app.url;
import { config } from './env'

export { config, isDevelopment, isProduction, getApiUrl, getAppUrl } from './env'

// Legacy export for compatibility
export const getWebConfig = () => config