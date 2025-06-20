import type { Request, Response } from 'express';
import { auth } from '../lib/auth';
import { respondWithError, respondWithSuccess, respondWithCreated } from '../lib/json';
import { fromNodeHeaders } from 'better-auth/node';
import { extractErrorDetails } from '../types/betterAuthErrors';

export async function signUpHandler(req: Request, res: Response): Promise<void> {
  try {
    console.log("Calling auth.api.signUpEmail directly");
    const result = await auth.api.signUpEmail({
      body: req.body
    });
    console.log("SignUp Success:", result);
    respondWithCreated(res, result, 'User created successfully');
  } catch (error: unknown) {
    console.error("SignUp Error:", error);
    const { statusCode, message } = extractErrorDetails(error);
    respondWithError(res, statusCode, message);
  }
}

export async function signInHandler(req: Request, res: Response): Promise<void> {
  try {
    console.log("Calling auth.api.signInEmail directly");
    const result = await auth.api.signInEmail({
      body: req.body,
      headers: req.headers
    });
    console.log("SignIn Success:", result);
    respondWithSuccess(res, result, 'User signed in successfully');
  } catch (error: unknown) {
    console.error("SignIn Error:", error);
    const { statusCode, message } = extractErrorDetails(error);
    respondWithError(res, statusCode, message);
  }
}

export async function getSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    });
    respondWithSuccess(res, result);
  } catch (error: unknown) {
    console.error("GetSession Error:", error);
    const { statusCode, message } = extractErrorDetails(error);
    respondWithError(res, statusCode, message);
  }
}

export async function signOutHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await auth.api.signOut({
      headers: req.headers
    });
    respondWithSuccess(res, result, 'User signed out successfully');
  } catch (error: unknown) {
    console.error("SignOut Error:", error);
    const { statusCode, message } = extractErrorDetails(error);
    respondWithError(res, statusCode, message);
  }
}
