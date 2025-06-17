import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { middlewareLogResponse, errorMiddleware } from "./middleware";
 
export const app = express();

app.use(middlewareLogResponse);

app.all("/api/auth/*", toNodeHandler(auth));
 
// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());
 
app.use(errorMiddleware);
