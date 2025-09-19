import { app } from './app'
import { config } from './config';
import { CronScheduler } from './scheduler/cronScheduler';

// Start cron scheduler in production and development
if (process.env.NODE_ENV !== 'test') {
    CronScheduler.start();
  }
  
  // Graceful shutdown handling
  process.on('SIGINT', () => {
    console.log('📴 Shutting down server...');
    CronScheduler.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('📴 Shutting down server...');
    CronScheduler.stop();
    process.exit(0);
  });
  
app.listen(config.env.port, () => {
    console.log(`API server listening on port ${config.env.port}`);
});