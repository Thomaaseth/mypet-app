import { config } from './env'

export { config, isDevelopment, isProduction, getApiUrl, getAppUrl } from './env'

// Legacy export for compatibility
export const getWebConfig = () => config