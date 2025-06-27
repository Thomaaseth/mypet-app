// apps/api/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"
import { config } from "../config";
import { createAuthMiddleware, APIError } from "better-auth/api"
import { emailService } from "./email/email.service";

console.log("Creating Better-auth instance...");

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    secret: config.auth.secret,
    baseURL: config.auth.url,
    trustedOrigins: ["http://localhost:3000"],
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
            console.log(`Sending reset password email to ${user.email}`);
            
            const result = await emailService.sendPasswordResetEmail(
                { 
                    email: user.email, 
                    name: user.name || user.email.split('@')[0] 
                },
                url
            );
            
            if (!result.success) {
                console.error('Failed to send reset password email:', result.error);
                throw new Error('Failed to send reset password email');
            }
            
            console.log('Reset password email sent successfully');
        },
        resetPasswordTokenExpiresIn: 3600, // 1 hour
    },
    // Email verification is configured separately at the root level
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }: {
            user: { id: string; email: string; name: string | null; emailVerified: boolean };
            url: string;
            token: string;
        }, request?: Request) => {
            // Send verification email using Resend
            console.log(`Sending verification email to ${user.email}`);
            
            const result = await emailService.sendVerificationEmail(
                { 
                    email: user.email, 
                    name: user.name || user.email.split('@')[0] 
                },
                url
            );
            
            if (!result.success) {
                console.error('Failed to send verification email:', result.error);
                throw new Error('Failed to send verification email');
            }
            
            console.log('Verification email sent successfully');
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
                console.log(`Sending email change verification to ${newEmail}`);
                
                const result = await emailService.sendEmailChangeVerification(
                    { 
                        email: user.email, 
                        name: user.name || user.email.split('@')[0] 
                    },
                    newEmail,
                    url
                );
                
                if (!result.success) {
                    console.error('Failed to send email change verification:', result.error);
                    throw new Error('Failed to send email change verification');
                }
                
                console.log('Email change verification sent successfully');
            },
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            // Only validate on signup
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

console.log("Better-auth initialized successfully");
console.log("🔧 Available endpoints:", Object.keys(auth));