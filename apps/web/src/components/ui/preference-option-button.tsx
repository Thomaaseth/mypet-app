import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PreferenceOptionButtonProps {
  label: string;
  description: string;
  isActive: boolean;
  isSaving?: boolean;
  disabled?: boolean;
  size?: 'default' | 'compact';
  onClick: () => void;
}

export function PreferenceOptionButton({
  label,
  description,
  isActive,
  isSaving = false,
  disabled = false,
  size = 'default',
  onClick,
}: PreferenceOptionButtonProps) {
  const isCompact = size === 'compact';

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size={isCompact ? 'sm' : 'default'}
      disabled={disabled}
      onClick={onClick}
      className={isCompact ? 'flex flex-col h-auto py-1 px-3 flex-1' : 'h-auto py-2 px-4 flex-1'}
    >
      <span className="flex items-center gap-2">
        {isSaving && (
          <Loader2 className={isCompact ? 'h-3 w-3 animate-spin shrink-0' : 'h-4 w-4 animate-spin shrink-0'} />
        )}
        <span className="flex flex-col items-center">
          <span className={isCompact ? 'font-semibold text-xs' : 'font-semibold text-sm'}>{label}</span>
          <span
            className={`font-normal ${isCompact ? 'text-[10px]' : 'text-xs'} ${
              isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}
          >
            {description}
          </span>
        </span>
      </span>
    </Button>
  );
}