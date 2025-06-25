'use client'

import { createAuthClient } from "better-auth/react"
import { getConfig } from "./config"

export const authClient = createAuthClient({
    baseURL: getConfig().api.baseUrl,
    fetchOptions: {
        credentials: "include",
    },
})