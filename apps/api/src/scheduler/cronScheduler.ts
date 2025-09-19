import { CronService } from '../services/cron.service';

export class CronScheduler {
  private static intervals: NodeJS.Timeout[] = [];
  private static isRunning = false;

  /**
   * Start the cron scheduler
   * Runs daily at 00:00 (midnight)
   */
  static start() {
    if (this.isRunning) {
      console.log('⚠️  Cron scheduler is already running');
      return;
    }

    console.log('🚀 Starting cron scheduler...');

    // Calculate milliseconds until next midnight
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0); // Next midnight
    
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    console.log(`⏰ Next food status update scheduled for: ${nextMidnight.toISOString()}`);
    console.log(`   (${Math.round(msUntilMidnight / 1000 / 60)} minutes from now)`);

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
    console.log('✅ Cron scheduler started successfully');
  }

  /**
   * Stop the cron scheduler
   */
  static stop() {
    if (!this.isRunning) {
      console.log('⚠️  Cron scheduler is not running');
      return;
    }

    console.log('🛑 Stopping cron scheduler...');
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    this.isRunning = false;
    console.log('✅ Cron scheduler stopped');
  }

  /**
   * Run all daily jobs
   */
  private static async runDailyJobs() {
    console.log('🌅 Running daily cron jobs at', new Date().toISOString());

    try {
      // Run food status update job
      const result = await CronService.runDailyFoodStatusUpdate();
      
      if (result.success) {
        console.log(`✅ Daily jobs completed successfully in ${result.executionTimeMs}ms`);
      } else {
        console.error(`❌ Daily jobs failed: ${result.error}`);
      }

    } catch (error) {
      console.error('💥 Daily jobs execution failed:', error);
    }
  }

  /**
   * Manual trigger for testing (optional)
   */
  static async runJobsManually(): Promise<void> {
    console.log('🔧 Manually triggering daily jobs...');
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