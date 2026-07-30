import type { Response } from "express";

export function respondWithError(res: Response, code: number, message: string): void {
    respondWithJSON(res, code, { error: message });
}

export function respondWithJSON(res: Response, code: number, payload: unknown): void {
    res.header("Content-Type", "application/json");
    const body = JSON.stringify(payload);
    res.status(code).send(body);
}

export function respondWithSuccess<T>(res: Response, data: T, message?: string): void {
    const payload = message ? { data, message } : { data };
    respondWithJSON(res, 200, payload);
}

export function respondWithCreated<T>(res: Response, data: T, message?: string): void {
    const payload = message ? { data, message } : { data };
    respondWithJSON(res, 201, payload);
}