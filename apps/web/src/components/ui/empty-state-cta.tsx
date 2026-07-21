import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyStateTitle, EmptyStateDescription } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface EmptyStateCtaProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
  withCard?: boolean;
  className?: string;
}

export function EmptyStateCta({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onAction,
  withCard = true,
  className,
}: EmptyStateCtaProps) {
  const content = (
    <div className={cn(
        'flex flex-col items-center justify-center text-center py-0', 
        className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <EmptyStateTitle className="mb-2">{title}</EmptyStateTitle>
      <EmptyStateDescription className="mb-6">{description}</EmptyStateDescription>
      <Button size="sm" onClick={onAction}>
        <Plus className="h-4 w-4" />
        {buttonLabel}
      </Button>
    </div>
  );

  if (!withCard) {
    return content;
  }

  return (
    <Card>
      <CardContent className="p-6">{content}</CardContent>
    </Card>
  );
}