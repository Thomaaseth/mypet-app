import type { Request, Response, NextFunction } from "express";
import {
    BadRequestError,
    NotFoundError,
    UserForbiddenError,
    UserNotAuthenticatedError,
} from './errors';

export function middlewareLogResponse(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
        const statusCode = res.statusCode;

        if (statusCode >= 300) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
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
        console.log(err.message);
    }

    res.status(statusCode).json({ error: message });
}