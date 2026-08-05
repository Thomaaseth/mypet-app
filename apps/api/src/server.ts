import { app } from './app'
import { config } from './config';
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
  
// Graceful shutdown handling
process.on('SIGINT', () => {
  serverLogger.info('Shutting down server (SIGINT)...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverLogger.info('Shutting down server (SIGTERM)...');
  process.exit(0);
});


const startedCb = () => {
  serverLogger.info({ port: config.env.port }, 'API server started');
};

if (process.env.NODE_ENV === 'production') {
  // Behind Caddy, bind loopback so the origin isn't reachable directly.
  app.listen(config.env.port, '127.0.0.1', startedCb);
} else {
  // Dev/test: default binding (all interfaces), unchanged.
  app.listen(config.env.port, startedCb);
}
// app.listen(config.env.port, () => {
//   serverLogger.info({ port: config.env.port }, 'API server started');
// });

