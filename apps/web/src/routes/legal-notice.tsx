import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/legal-notice')({
  component: LegalNoticePage,
});

function LegalNoticePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Legal Notice</h1>
      {/* TODO: French "mentions légales" (LCEN) — publisher identity/contact,
          hosting provider name + address, SIRET if applicable. */}
      <p className="text-muted-foreground">Placeholder content — to be authored.</p>
    </div>
  );
}