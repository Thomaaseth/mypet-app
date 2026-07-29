import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import VerifyEmailForm from '@/components/ui/auth/VerifyEmailForm'
import { sessionQueryOptions } from '@/queries/session'

const verifyEmailSearchSchema = z.object({
  email: z.string().email().optional(),
})

function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <VerifyEmailForm />
    </div>
  )
}

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
  validateSearch: verifyEmailSearchSchema,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (user) throw redirect({ to: '/' })
  },
})