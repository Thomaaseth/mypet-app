import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient';

// Import styles
import './globals.css'

// Initialize i18next before the app renders
import '@/i18n/config'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Recover from stale lazy chunks after a deploy. When a dynamic import fails
// reload once onto the fresh build. The timestamp guard prevents reload
// loops if the failure is not deploy-related and keeps recurring.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  try {
    const RELOAD_KEY = 'lastChunkReload'
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? '0')
    // Still inside the guard window: don't reload again (avoids a loop).
    if (Date.now() - lastReload < 10_000) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // storage unavailable (e.g. disabled/private mode); proceed to reload
    // without the loop guard rather than silently failing to recover.
  }
  window.location.reload()
})

// Create a new router instance
const router = createRouter({
  routeTree,
  scrollRestoration: true,
  context: {
    queryClient,
  },
})

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Get the root element
const rootElement = document.getElementById('root')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </React.StrictMode>
  )
}