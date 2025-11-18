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
    res.on('finish', () => {
        const statusCode = res.statusCode;

        try {
            if (statusCode >= 300 && statusCode !== 304) {
              httpLogger.info({
                method: req.method,
                url: req.url,
                statusCode,
              }, 'Non-OK response');
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