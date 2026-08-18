import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toastService } from '@/lib/toast'

export function useVersionCheck() {
  const { t } = useTranslation()
  useEffect(() => {
    if (!import.meta.env.PROD) return   // no version.json in dev
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' })
        if (!res.ok) return
        const ct = res.headers.get('content-type') ?? ''
        if (!ct.includes('application/json')) return  // SPA fallback served HTML; ignore
        const { buildId } = await res.json()
        if (!cancelled && buildId && buildId !== __BUILD_ID__) {
          toastService.app.updateAvailable(t, () => window.location.reload())
        }
      } catch { /* offline / transient — ignore */ }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    check()
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVisible) }
  }, [t])
}