import type { Request, Response, NextFunction } from "express";
import { respondWithError } from "../lib/json";
import {
    BadRequestError,
    NotFoundError,
    UserForbiddenError,
    UserNotAuthenticatedError,
} from './errors';
import { httpLogger } from '../lib/logger';

export function middlewareLogResponse(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
        try {
            const statusCode = res.statusCode;
            const duration = Date.now() - startTime;
            
            const logData = {
                method: req.method,
                url: req.url,
                statusCode,
                duration: `${duration}ms`,
            };
            
            // Always log errors
            if (statusCode >= 500) {
                httpLogger.error(logData, 'Server error');
            } else if (statusCode >= 400) {
                httpLogger.warn(logData, 'Client error');
            } else if (statusCode >= 300 && statusCode !== 304) {
                httpLogger.info(logData, 'Redirect');
            } else if (statusCode !== 304) {
                // Log successful requests at DEBUG level (only visible with LOG_LEVEL=debug)
                httpLogger.debug(logData, 'Request completed');
            }
        } catch (logError) {
            process.stderr.write(`[LOGGING ERROR] ${logError}\n`);
        }
    });
    next();
}

export function errorMiddleware(err: Error, _: Request, res: Response, __: NextFunction) {
    let statusCode = 500;
    let message = err.message;

    switch (err.constructor) {
        case BadRequestError:
            statusCode = 400;
            message = err.message;
            break;
        case UserNotAuthenticatedError:
            statusCode = 401;
            message = err.message;
            break;
        case UserForbiddenError:
            statusCode = 403;
            message = err.message;
            break;
        case NotFoundError:
            statusCode = 404;
            message = err.message;
            break;
        default:
            statusCode = 500;
            message = "Something went wrong on our end";
            break;
    }

    if (statusCode >= 500) {
        httpLogger.error({ err }, 'Server error');
    }

    respondWithError(res, statusCode, message);
}