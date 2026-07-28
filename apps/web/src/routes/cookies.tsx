import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/cookies')({
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
      {/* TODO: replace with real Cookie Policy copy — list the necessary
          (session/auth) cookie and the analytics cookie (currently unused,
          gated behind the consent banner if/when introduced). */}
      <p className="text-muted-foreground">Placeholder content — to be authored.</p>
    </div>
  );
}