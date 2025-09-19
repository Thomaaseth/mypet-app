export interface CronConfig {
    enabled: boolean;
    foodStatusUpdateTime: string; // HH:MM format
    manualTriggerEnabled: boolean;
    logLevel: 'info' | 'debug' | 'error';
  }
  
  export function getCronConfig(): CronConfig {
    return {
      // Enable/disable cron jobs
      enabled: process.env.CRON_ENABLED !== 'false', // Default: true
      
      // Time to run daily food status update (24-hour format)
      foodStatusUpdateTime: process.env.CRON_FOOD_STATUS_TIME || '00:00',
      
      // Allow manual trigger via API endpoints
      manualTriggerEnabled: process.env.CRON_MANUAL_TRIGGER_ENABLED !== 'false', // Default: true
      
      // Logging level for cron jobs
      logLevel: (process.env.CRON_LOG_LEVEL as 'info' | 'debug' | 'error') || 'info',
    };
  }
  
  // Helper to parse time string (HH:MM) into hours and minutes
  export function parseTimeString(timeString: string): { hours: number; minutes: number } {
    const [hoursStr, minutesStr] = timeString.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time format: ${timeString}. Expected HH:MM format (e.g., "14:30")`);
    }
    
    return { hours, minutes };
  }