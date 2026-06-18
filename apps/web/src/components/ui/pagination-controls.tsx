import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MutedText } from '@/components/ui/typography';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function PaginationControls({ currentPage, totalPages, onPrevious, onNext }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
      <MutedText>
        Page {currentPage} of {totalPages}
      </MutedText>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={onPrevious} disabled={currentPage === 1}>
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={onNext} disabled={currentPage === totalPages}>
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}