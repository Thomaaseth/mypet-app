import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      {/* TODO: replace with real Privacy Policy copy (GDPR Art. 13/14: data collected,
          legal basis per category, retention, user rights, controller contact). */}
      <p className="text-muted-foreground">Placeholder content — to be authored.</p>
    </div>
  );}
