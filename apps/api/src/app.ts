import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { middlewareLogResponse, errorMiddleware } from "./middleware";
import { healthCheck, readinessCheck } from "./handlers/health";
 
export const app = express();

app.use(middlewareLogResponse);

app.all("/api/auth/", toNodeHandler(auth));
 
app.use(express.json());

app.get('/api/health', (req, res, next) => {
    Promise.resolve(healthCheck(req, res)).catch(next);
});
app.get('/api/ready', (req, res, next) => {
    Promise.resolve(readinessCheck(req, res)).catch(next);
});
 
app.use(errorMiddleware);
