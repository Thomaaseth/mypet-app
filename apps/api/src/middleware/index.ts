import type { Request, Response, NextFunction } from "express";
import { respondWithError } from "../lib/json";
import {
    BadRequestError,
    NotFoundError,
    UserForbiddenError,
    UserNotAuthenticatedError,
} from './errors';
import { httpLogger } from '../lib/logger';
import { MulterError } from 'multer';

export function middlewareLogResponse(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
        try {
            const statusCode = res.statusCode;
            const duration = Date.now() - startTime;
            
            const logData = {
                method: req.method,
                url: req.originalUrl,
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
    let message = "Something went wrong on our end";

    // instanceof matches the service layer's pattern
    if (err instanceof BadRequestError) {
        statusCode = 400;
        message = err.message;
    } else if (err instanceof UserNotAuthenticatedError) {
        statusCode = 401;
        message = err.message;
    } else if (err instanceof UserForbiddenError) {
        statusCode = 403;
        message = err.message;
    } else if (err instanceof NotFoundError) {
        statusCode = 404;
        message = err.message;
    } else if (err instanceof MulterError) {
        // Multer's own limit violations (size/count/unexpected field) are
        // CLIENT errors, not server errors, must not fall through to 500.
        if (err.code === 'LIMIT_FILE_SIZE') {
            statusCode = 413; // Payload Too Large
            message = 'File too large';
        } else {
            statusCode = 400; // other limits: too many files, unexpected field
            message = 'Invalid file upload';
        }
    }

    if (statusCode >= 500) {
        httpLogger.error({ err }, 'Server error');
    }

    respondWithError(res, statusCode, message);
}