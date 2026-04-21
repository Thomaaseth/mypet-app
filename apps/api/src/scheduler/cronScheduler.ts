import { CronService } from '../services/cron.service';
import { logger } from '../lib/logger';

const cronLogger = logger.child({ module: 'cron' });

export class CronScheduler {
  private static intervals: NodeJS.Timeout[] = [];
  private static isRunning = false;

  /**
   * Start the cron scheduler
   * Runs daily at 00:00 (midnight)
   */
  static start() {
    if (this.isRunning) {
      cronLogger.warn('Cron scheduler is already running');
      return;
    }

    cronLogger.info('Starting cron scheduler');

    // Calculate milliseconds until next midnight
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0); // Next midnight
    
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    cronLogger.info(
      {
        nextRun: nextMidnight.toISOString(),
        minutesFromNow: Math.round(msUntilMidnight / 1000 / 60),
      },
      'Next food status update scheduled',
    );

    // Set timeout for first run at next midnight
    setTimeout(() => {
      this.runDailyJobs();
      
      // Then run every 24 hours
      const dailyInterval = setInterval(() => {
        this.runDailyJobs();
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

      this.intervals.push(dailyInterval);
    }, msUntilMidnight);

    this.isRunning = true;
    cronLogger.info('Cron scheduler started successfully');
  }

  /**
   * Stop the cron scheduler
   */
  static stop() {
    if (!this.isRunning) {
      cronLogger.warn('Cron scheduler is not running');
      return;
    }

    cronLogger.info('Stopping cron scheduler');
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    this.isRunning = false;
    cronLogger.info('Cron scheduler stopped');
  }

  /**
   * Run all daily jobs
   */
  private static async runDailyJobs() {
    cronLogger.info({ timestamp: new Date().toISOString() }, 'Running daily cron jobs');

    try {
      // Run food status update job
      const result = await CronService.runDailyFoodStatusUpdate();
      
      if (result.success) {
        cronLogger.info(
          { executionTimeMs: result.executionTimeMs },
          'Daily jobs completed successfully',
        );
      } else {
        cronLogger.error({ err: result.error }, 'Daily jobs failed');
      }

    } catch (error) {
      cronLogger.error({ err: error }, 'Daily jobs execution threw unexpectedly');
    }
  }

  /**
   * Manual trigger for testing (optional)
   */
  static async runJobsManually(): Promise<void> {
    cronLogger.info('Manual job trigger requested');
    await this.runDailyJobs();
  }

  /**
   * Get scheduler status
   */
  static getStatus(): { isRunning: boolean; activeIntervals: number } {
    return {
      isRunning: this.isRunning,
      activeIntervals: this.intervals.length
    };
  }
}