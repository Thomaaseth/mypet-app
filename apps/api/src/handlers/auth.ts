import type { Request, Response } from 'express';
import { auth } from '../lib/auth';
import { respondWithError, respondWithSuccess, respondWithCreated } from '../lib/json';
import { fromNodeHeaders } from 'better-auth/node';

export async function signUpHandler(req: Request, res: Response) {
  try {
    console.log("Calling auth.api.signUpEmail directly");
    const result = await auth.api.signUpEmail({
      body: req.body
    });
    console.log("SignUp Success:", result);
    respondWithCreated(res, result, 'User created successfully');
  } catch (error) {
    console.error("SignUp Error:", error);
    respondWithError(res, 400, 'Sign up failed');
  }
}

export async function signInHandler(req: Request, res: Response) {
  try {
    console.log("Calling auth.api.signInEmail directly");
    const result = await auth.api.signInEmail({
      body: req.body,
      headers: req.headers
    });
    console.log("SignIn Success:", result);
    respondWithSuccess(res, result, 'User signed in successfully');
  } catch (error) {
    console.error("SignIn Error:", error);
    respondWithError(res, 400, 'Sign in failed');
  }
}

export async function getSessionHandler(req: Request, res: Response) {
  try {
    const result = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    });
    respondWithSuccess(res, result);
  } catch (error) {
    console.error("GetSession Error:", error);
    respondWithError(res, 400, 'Failed to get session');
  }
}

export async function signOutHandler(req: Request, res: Response) {
  try {
    const result = await auth.api.signOut({
      headers: req.headers
    });
    respondWithSuccess(res, result, 'User signed out successfully');
  } catch (error) {
    console.error("SignOut Error:", error);
    respondWithError(res, 400, 'Sign out failed');
  }
}