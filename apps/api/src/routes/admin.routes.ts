import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { CronScheduler } from '../scheduler/cronScheduler';
import { CronService } from '../services/cron.service';
import { globalAuthHandler, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { respondWithSuccess, respondWithError } from '../lib/json';
import { BadRequestError } from '../middleware/errors';
import { getCronConfig } from '../config/cron.config';
import { logger } from '../lib/logger';

const router = Router();

// Apply auth middleware to all admin routes
router.use(globalAuthHandler);

/**
 * GET /api/admin/cron/status
 * Get cron scheduler status and job statistics
 */
router.get('/cron/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schedulerStatus = CronScheduler.getStatus();
    const jobStats = await CronService.getFoodStatusJobStats();
    const config = getCronConfig();

    const responseData = {
      scheduler: schedulerStatus,
      stats: jobStats,
      config: {
        enabled: config.enabled,
        foodStatusUpdateTime: config.foodStatusUpdateTime,
        manualTriggerEnabled: config.manualTriggerEnabled,
        logLevel: config.logLevel
      }
    };

    respondWithSuccess(res, responseData, 'Cron status retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/cron/trigger
 * Manually trigger the daily food status update job
 */
router.post('/cron/trigger', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = getCronConfig();
    
    if (!config.manualTriggerEnabled) {
      throw new BadRequestError('Manual cron trigger is disabled');
    }

    logger.info({ userId: req.authSession?.user.id }, 'Manual cron job trigger requested');
    
    const result = await CronService.runDailyFoodStatusUpdate();
    
    const responseData = {
      result,
      triggeredBy: req.authSession?.user.id,
      triggeredAt: new Date().toISOString()
    };

    respondWithSuccess(res, responseData, 'Cron job executed successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/cron/start
 * Start the cron scheduler
 */
router.post('/cron/start', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    CronScheduler.start();
    
    const responseData = {
      action: 'start',
      performedBy: req.authSession?.user.id,
      performedAt: new Date().toISOString(),
      status: CronScheduler.getStatus()
    };

    respondWithSuccess(res, responseData, 'Cron scheduler started successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/cron/stop
 * Stop the cron scheduler
 */
router.post('/cron/stop', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    CronScheduler.stop();
    
    const responseData = {
      action: 'stop',
      performedBy: req.authSession?.user.id,
      performedAt: new Date().toISOString(),
      status: CronScheduler.getStatus()
    };

    respondWithSuccess(res, responseData, 'Cron scheduler stopped successfully');
  } catch (error) {
    next(error);
  }
});

export default router;