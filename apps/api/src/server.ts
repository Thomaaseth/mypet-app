import { app } from './app'
import { config } from './config';
import { CronScheduler } from './scheduler/cronScheduler';
import { serverLogger } from './lib/logger';

process.on('warning', (warning) => {
  if (warning.name === 'TimeoutNegativeWarning') {
    // Known postgres.js issue with idle_timeout: 0
    serverLogger.warn({ 
      warning: warning.name,
      message: warning.message,
      stack: warning.stack 
    }, 'Postgres.js timeout warning (known issue, to keep watching)');
    return;
  }
  
  serverLogger.warn({ 
    warning: warning.name,
    message: warning.message 
  }, 'Process warning');
});

// Start cron scheduler in production and development
if (process.env.NODE_ENV !== 'test') {
    CronScheduler.start();
}
  
// Graceful shutdown handling
process.on('SIGINT', () => {
  serverLogger.info('Shutting down server (SIGINT)...');
  CronScheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverLogger.info('Shutting down server (SIGTERM)...');
  CronScheduler.stop();
  process.exit(0);
});

app.listen(config.env.port, () => {
  serverLogger.info({ port: config.env.port }, 'API server started');
});