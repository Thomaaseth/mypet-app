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
    emailAndPassword: {
        enabled: true,
        disableSignUp: false,
		requireEmailVerification: false,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		autoSignIn: true,
		sendResetPassword: async ({ user, url, token }) => {
			// Send reset password email
		},
		resetPasswordTokenExpiresIn: 3600, // 1 hour
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


// export const auth = betterAuth({
//     database: drizzleAdapter(db, {
//         provider: "pg",
//     }),
//     secret: config.auth.secret,
//     baseURL: config.auth.url,
//     // basePath: "/api/auth",
//     emailAndPassword: {
//         enabled: true,
//     }
// });

console.log("Better-auth initialized successfully");
console.log("🔧 Available endpoints:", Object.keys(auth));
