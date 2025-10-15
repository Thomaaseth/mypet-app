import { createAuthClient } from "better-auth/react"
import { getApiUrl } from "./config"

export const authClient = createAuthClient({
    baseURL: getApiUrl(),
    fetchOptions: {
        credentials: "include",
    },
})