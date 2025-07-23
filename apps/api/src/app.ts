import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { middlewareLogResponse, errorMiddleware } from "./middleware";
import { healthCheck, readinessCheck } from "./handlers/health";
import cors from 'cors';
import { config } from "./config";

import petRoutes from '@/routes/pets.routes';
import foodRoutes from '@/routes/food.routes';

export const app = express();

app.use(cors({
    origin: config.env.webUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(middlewareLogResponse);

// Better-auth routes
app.all('/api/auth/*splat', toNodeHandler(auth));

// JSON Parsing middleware
app.use(express.json());

// PET ROUTES
app.use('/api/pets', petRoutes)

// FOOD ROUTES
app.use('/api', foodRoutes)

// APP HEALTH
app.get('/api/health', (req, res, next) => {
    Promise.resolve(healthCheck(req, res)).catch(next);
});
app.get('/api/ready', (req, res, next) => {
    Promise.resolve(readinessCheck(req, res)).catch(next);
});
 
app.use(errorMiddleware);
