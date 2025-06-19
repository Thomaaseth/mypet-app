import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { middlewareLogResponse, errorMiddleware } from "./middleware";
import { healthCheck, readinessCheck } from "./handlers/health";
import { signUpHandler, signInHandler, getSessionHandler, signOutHandler} from './handlers/auth'
import cors from 'cors';

export const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(middlewareLogResponse);
app.use(express.json());




// BETTER-AUTH
app.post('/api/auth/sign-up/email', (req, res, next) => {
    Promise.resolve(signUpHandler(req, res)).catch(next);
});
app.post('/api/auth/sign-in/email', (req, res, next) => {
    Promise.resolve(signInHandler(req, res)).catch(next);
});
app.get('/api/auth/session', (req, res, next) => {
    Promise.resolve(getSessionHandler(req, res)).catch(next);
});
app.post('/api/auth/sign-out', (req, res, next) => {
    Promise.resolve(signOutHandler(req, res)).catch(next);
});

// APP HEALTH
app.get('/api/health', (req, res, next) => {
    Promise.resolve(healthCheck(req, res)).catch(next);
});
app.get('/api/ready', (req, res, next) => {
    Promise.resolve(readinessCheck(req, res)).catch(next);
});
 
app.use(errorMiddleware);
