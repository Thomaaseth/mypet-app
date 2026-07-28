import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      {/* TODO: replace with real Terms of Service copy. */}
      <p className="text-muted-foreground">Placeholder content — to be authored.</p>
    </div>
  );
}