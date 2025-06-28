'use client'

import { createAuthClient } from "better-auth/react"
import { getWebConfig } from "./config"

export const authClient = createAuthClient({
    baseURL: getWebConfig().api.baseUrl,
    fetchOptions: {
        credentials: "include",
    },
})