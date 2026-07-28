import type { ReactNode } from 'react';
import { PageTitle } from '@/components/ui/typography';

interface LegalPageLayoutProps {
  title: string;
  lastUpdatedLabel: string;
  children: ReactNode;
}

// Shared by privacy.tsx, terms.tsx, legal-notice.tsx, cookies.tsx so spacing
// and heading hierarchy stay consistent across all four legal documents,
// rather than each route hand-rolling its own container/typography.
export function LegalPageLayout({ title, lastUpdatedLabel, children }: LegalPageLayoutProps) {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <PageTitle className="mb-2">{title}</PageTitle>
      <p className="text-sm text-muted-foreground mb-8 italic">{lastUpdatedLabel}</p>
      <div className="flex flex-col gap-6 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

// Consistent section heading + paragraph/list styling for legal prose —
// plain h2/p rather than SectionTitle (h3), since these pages have no page
// title above them competing for the h1 slot the way in-app sections do.
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-bold text-base">{title}</h2>
      <div className="flex flex-col gap-2 text-foreground/90">{children}</div>
    </section>
  );
}

// Visually distinguishes "note for whoever reviews this" asides from the
// actual legal text itself, so they're never mistaken for user-facing copy.
export function LegalReviewNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground border-l-2 border-muted pl-3 italic">
      {children}
    </p>
  );
}