export const ENV_CONFIG = {
    development: {
      API_PORT: 3001,
      WEB_PORT: 3000,
      API_URL: 'http://localhost:3001',
      WEB_URL: 'http://localhost:3000',
    },
    production: {
      API_PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
      WEB_PORT: 3000,
      API_URL: process.env.API_URL || 'https://api.yourdomain.com',
      WEB_URL: process.env.WEB_URL || 'https://yourdomain.com',
    },
    test: {
      API_PORT: 3002,
      WEB_PORT: 3003,
      API_URL: 'http://localhost:3002',
      WEB_URL: 'http://localhost:3003',
    }
  } as const;
  
  export type Environment = keyof typeof ENV_CONFIG;
  
  export function getEnvironment(): Environment {
    const env = process.env.NODE_ENV as Environment;
    return env && env in ENV_CONFIG ? env : 'development';
  }
  
  export function getConfig() {
    const env = getEnvironment();
    return ENV_CONFIG[env];
  }
  
  // Derived URLs
  export function getApiUrl() {
    return getConfig().API_URL;
  }
  
  export function getWebUrl() {
    return getConfig().WEB_URL;
  }
  
  export function getApiPort() {
    return getConfig().API_PORT;
  }
  
  export function getWebPort() {
    return getConfig().WEB_PORT;
  }
  
  // Better Auth
  export function getBetterAuthConfig() {
    const config = getConfig();
    return {
      baseURL: config.API_URL,
      trustedOrigins: [config.WEB_URL],
      callbackURL: config.WEB_URL,
    };
  }
  
  // CORS 
  export function getCorsConfig() {
    return {
      origin: getWebUrl(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    };
  }