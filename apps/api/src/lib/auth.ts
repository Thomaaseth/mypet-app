// apps/api/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"
import { config } from "../config";
import { createAuthMiddleware, APIError } from "better-auth/api"
import { emailService } from "./email/email.service";
import { authLogger } from './logger';

authLogger.info('Creating Better-auth instance...');

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    secret: config.auth.secret,
    baseURL: config.env.apiUrl,
    trustedOrigins: [config.env.webUrl],
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // 5 minutes cache
        }
    },
    advanced: {
        useSecureCookies: process.env.NODE_ENV === "production",
        cookiePrefix: "pettr-auth", 
        crossSubDomainCookies: process.env.NODE_ENV === "production" ? {
            enabled: true,
            domain: ".yourdomain.com" // Set actual domain for production
        } : undefined,
    },
    emailAndPassword: {
        enabled: true,
        disableSignUp: false,
        requireEmailVerification: true, // Require email verification for login
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
        sendResetPassword: async ({ user, url, token }: { 
            user: { id: string; email: string; name: string | null }; 
            url: string; 
            token: string 
        }) => {
            // Send reset password email using Resend
            authLogger.info({ email: user.email }, 'Sending reset password email');
            
            const result = await emailService.sendPasswordResetEmail(
                { 
                    email: user.email, 
                    name: user.name || user.email.split('@')[0] 
                },
                url
            );
                        
            if (!result.success) {
                authLogger.error({ error: result.error, email: user.email }, 'Failed to send reset password email');
                throw new Error('Failed to send reset password email');
            }
            
            authLogger.info({ email: user.email }, 'Reset password email sent successfully');
        },
        resetPasswordTokenExpiresIn: 3600, // 1 hour
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }: {
            user: { id: string; email: string; name: string | null; emailVerified: boolean };
            url: string;
            token: string;
        }, request?: Request) => {
            // Send verification email using Resend

            const urlObj = new URL(url);
            urlObj.searchParams.set('callbackURL', config.env.webUrl);
            // urlObj.searchParams.set('callbackURL', config.app.url);
            const modifiedUrl = urlObj.toString();

            authLogger.info({ email: user.email }, 'Sending email verification');
            
            const result = await emailService.sendVerificationEmail(
                { 
                    email: user.email, 
                    name: user.name || user.email.split('@')[0] 
                },
                modifiedUrl
            );
            
            if (!result.success) {
                authLogger.error({ error: result.error, email: user.email }, 'Failed to send email verification');
                throw new Error('Failed to send verification email');
            }
            
            authLogger.info({ email: user.email }, 'Email verification sent successfully');
        },
        sendOnSignUp: true, // Automatically send verification email on signup
        autoSignInAfterVerification: true, // Auto sign in after email verification
    },
    user: {
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async ({ user, newEmail, url, token }: {
                user: { id: string; email: string; name: string | null };
                newEmail: string;
                url: string;
                token: string;
            }) => {
                // Send change email verification using Resend
                authLogger.info({ newEmail: newEmail }, 'Sending email change verification');
                const urlObj = new URL(url);
                urlObj.searchParams.set('callbackURL', config.env.webUrl);
                const modifiedUrl = urlObj.toString();

                const result = await emailService.sendEmailChangeVerification(
                    { 
                        email: user.email, 
                        name: user.name || user.email.split('@')[0] 
                    },
                    newEmail,
                    modifiedUrl
                );
                
                if (!result.success) {
                    authLogger.error({ error: result.error, newEmail: newEmail }, 'Failed to send email change verification');
                    throw new Error('Failed to send email change verification');
                }
                
                authLogger.info({ newEmail: newEmail }, 'Email change verification sent successfully');
            },
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== "/sign-up/email") {
                return;
            }

            const password = ctx.body?.password;
            if (!password) {
                throw new APIError("BAD_REQUEST", {
                    message: "Password is required",
                });
            }

            // Server-side password complexity validation
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumber = /\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            if (!hasUppercase) {
                throw new APIError("BAD_REQUEST", {
                    message: "Password must contain at least one uppercase letter",
                });
            }

            if (!hasLowercase) {
                throw new APIError("BAD_REQUEST", {
                    message: "Password must contain at least one lowercase letter",
                });
            }

            if (!hasNumber) {
                throw new APIError("BAD_REQUEST", {
                    message: "Password must contain at least one number",
                });
            }

            if (!hasSpecialChar) {
                throw new APIError("BAD_REQUEST", {
                    message: "Password must contain at least one special character",
                });
            }
        }),
    },
})

authLogger.info('Better-auth initialized successfully');
authLogger.debug({ endpoints: Object.keys(auth) }, 'Available Better-auth endpoints');
