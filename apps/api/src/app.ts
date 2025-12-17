import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { middlewareLogResponse, errorMiddleware } from "./middleware";
import { healthCheck, readinessCheck } from "./handlers/health";
import cors from 'cors';
import { config } from "./config";

import petRoutes from '@/routes/pets.routes';
import foodRoutes from '@/routes/food.routes';
import adminRoutes from '@/routes/admin.routes';
import vetRoutes from '@/routes/veterinarians.routes';
import appointmentRoutes from '@/routes/appointments.routes';

export const app = express();

app.use(cors({
    origin: config.env.webUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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
app.use('/api/pets', foodRoutes)

// VET ROUTES
app.use('/api/vets', vetRoutes)

// APPOINTMENT ROUTES
app.use('/api/appointments', appointmentRoutes)

// APP HEALTH   
app.get('/api/health', (req, res, next) => {
    Promise.resolve(healthCheck(req, res)).catch(next);
});
app.get('/api/ready', (req, res, next) => {
    Promise.resolve(readinessCheck(req, res)).catch(next);
});

// ADMIN ROUTES
app.use('/api/admin', adminRoutes);

 
app.use(errorMiddleware);
