import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { middlewareLogResponse, errorMiddleware } from "./middleware";
import { healthCheck, readinessCheck } from "./handlers/health";
import cors from 'cors';
import { config } from "./config";

export const app = express();

app.use(cors({
    origin: config.env.webUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(middlewareLogResponse);

app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json());



// APP HEALTH
app.get('/api/health', (req, res, next) => {
    Promise.resolve(healthCheck(req, res)).catch(next);
});
app.get('/api/ready', (req, res, next) => {
    Promise.resolve(readinessCheck(req, res)).catch(next);
});
 
app.use(errorMiddleware);
