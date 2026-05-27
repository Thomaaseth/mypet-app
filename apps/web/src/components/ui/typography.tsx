import { cn } from '@/lib/utils';

// ─── Typography hierarchy ─────────────────────────────────────────────────────
//
//  CardTitle  (h2, text-xl,   font-bold) → lives in card.tsx, NOT here
//  SectionTitle    (h3, text-lg,   font-bold) → sub-section headers inside cards
//  EmptyStateTitle (h4, text-base, font-bold) → "No X yet" inside a section
//
//  All h1–h4 get Bricolage Grotesque via @layer base in globals.css
//  All p elements get Montserrat via body inheritance
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Page Level ───────────────────────────────────────────────────────────────

export function PageTitle({
  className,
  ...props
}: React.ComponentProps<'h1'>) {
  return (
    <h1
      className={cn('font-bold', className)}
      style={{ fontSize: 'clamp(1.25rem, 5vw, 1.875rem)' }}
      {...props}
    />
  );
}

// ─── Section Level (h3) ───────────────────────────────────────────────────────
// "Weight Progress", "Weight History", "Dry Food Entries"

export function SectionTitle({
  className,
  ...props
}: React.ComponentProps<'h3'>) {
  return (
    <h3
      className={cn('font-bold', className)}
      style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)' }}
      {...props}
    />
  );
}

// ─── Empty State Level (h4) ───────────────────────────────────────────────────
// "No weight tracked yet", "No notes yet", "No active dry food tracked"
// Sits inside a section — one level below SectionTitle

export function EmptyStateTitle({
  className,
  ...props
}: React.ComponentProps<'h4'>) {
  return (
    <h4
      className={cn('text-base font-bold', className)}
      {...props}
    />
  );
}

// Subtitle under the empty state title
export function EmptyStateDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
// Montserrat via body inheritance
// StatLabel: "Remaining", "Days Left", "Depletion Date"
// StatValue: the actual number or date value

export function StatLabel({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-sm font-medium text-muted-foreground', className)}
      {...props}
    />
  );
}

export function StatValue({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-lg font-bold font-display', className)}
      {...props}
    />
  );
}

// ─── Entry Level (h4) ─────────────────────────────────────────────────────────
// Entry names inside nested/collapsed sections
// e.g. food history rows, future list items

export function EntryTitle({
  className,
  ...props
}: React.ComponentProps<'h4'>) {
  return (
    <h4
      className={cn('text-sm font-bold', className)}
      {...props}
    />
  );
}

// ─── Metric Display ───────────────────────────────────────────────────────────
// For prominent single-value displays — "current weight", "days remaining" hero numbers
// Larger than StatValue, same Bricolage Grotesque via font-display

export function MetricValue({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('font-bold font-display', className)}
      style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}
      {...props}
    />
  );
}
  
  export function MetricLabel({
    className,
    ...props
  }: React.ComponentProps<'p'>) {
    return (
      <p
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  }

// ─── Body Text ────────────────────────────────────────────────────────────────
// Montserrat via body inheritance
// BodyText:  full foreground — user content, note text, regular data
// MutedText: dimmed          — helper text, metadata, secondary info

export function BodyText({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-sm', className)}
      {...props}
    />
  );
}

export function MutedText({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}