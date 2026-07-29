import { authClient } from '@/lib/auth-client'
import { getAppUrl } from '@/lib/config'
import { useErrorState } from '@/hooks/useErrorsState'
import { authErrorHandler } from '@/lib/errors/handlers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, MailCheck, ArrowLeft } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearch, useNavigate } from '@tanstack/react-router'
import { MutedText } from '@/components/ui/typography'
import { toastService } from '@/lib/toast'
import { useRefreshSession, sessionQueryOptions } from '@/queries/session'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

const RESEND_COOLDOWN_SECONDS = 5 * 60 // 5 minutes

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VerifyEmailForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { email } = useSearch({ from: '/verify-email' })
  const { isLoading, error, executeAction } = useErrorState()
  const { refreshSession } = useRefreshSession()
  const queryClient = useQueryClient()

  // Cooldown starts immediately on mount — signup/redirect just triggered a send.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  // Countdown tick
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  // Level 1.5: when the user tabs back after verifying in another tab,
  // re-check the session. A non-null session means they're verified + signed in
  // (getSession returns null until verified), so send them into the app.
  const checkingRef = useRef(false)
  useEffect(() => {
    const onFocus = async () => {
      if (checkingRef.current) return
      checkingRef.current = true
      try {
        await refreshSession()
        const user = queryClient.getQueryData(sessionQueryOptions.queryKey)
        if (user) navigate({ to: '/' })
      } finally {
        checkingRef.current = false
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshSession, queryClient, navigate])

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return
    const result = await executeAction(
      async () => {
        const response = await authClient.sendVerificationEmail({
          email,
          callbackURL: getAppUrl(),
        })
        if ('error' in response && response.error) {
          throw response.error
        }
        return response
      },
      authErrorHandler
    )
    if (result) {
      toastService.auth.verificationSent(t)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    }
  }, [email, cooldown, executeAction, t])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <MailCheck className="mx-auto h-12 w-12 text-success mb-4" />
        <CardTitle>{t('auth.verifyEmail.title')}</CardTitle>
        <CardDescription>
          {email
            ? t('auth.verifyEmail.subtitle', { email })
            : t('auth.verifyEmail.subtitleNoEmail')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <MutedText className="text-center">
            {t('auth.verifyEmail.noEmailHelper')}
          </MutedText>

          <Button
            className="w-full"
            onClick={handleResend}
            disabled={isLoading || cooldown > 0 || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('auth.verifyEmail.resending')}
              </>
            ) : cooldown > 0 ? (
              t('auth.verifyEmail.resendCooldown', { time: formatTime(cooldown) })
            ) : (
              t('auth.verifyEmail.resend')
            )}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              {t('auth.verifyEmail.backToLogin')}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}