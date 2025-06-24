import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"
import { config } from "../config";
import { createAuthMiddleware, APIError } from "better-auth/api"

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
		requireEmailVerification: false,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		autoSignIn: true,
		sendResetPassword: async ({ user, url, token }) => {
			// Send reset password email
            console.log(`Send reset password email to ${user.email}`);
            console.log(`Reset URL: ${url}`);
            // TODO: Implement email sending
		},
		resetPasswordTokenExpiresIn: 3600, // 1 hour
    },
    user: {
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
                 // Send change email verification email
                 console.log(`Send email change verification to ${newEmail}`);
                 console.log(`Verification URL: ${url}`);
                 console.log(`User: ${user.email} wants to change to: ${newEmail}`);
                 // TODO: Implement email sending
                 // This should send an email to the NEW email address with the verification link
            },
        },
        deleteUser: {
            enabled: true,
            sendDeleteAccountVerification: async ({ user, url, token }) => {
                // Send account deletion verification email  
                console.log(`Send delete account verification to ${user.email}`);
                console.log(`Verification URL: ${url}`);
                // TODO: Implement email sending
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
