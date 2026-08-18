import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/useIsMobile"
import { parseDateOnly, toLocalDateString } from "@/lib/utils/date-formatting"
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';
import { useTranslation } from "react-i18next"

interface DatePickerProps {
  id?: string;
  value: string | undefined; // "YYYY-MM-DD" — same contract as native input[type=date]
  onChange: (date: string) => void;
  disabled?: boolean;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
  placeholder?: string;
  "aria-invalid"?: boolean;
}

export function DatePicker({
  id,
  value,
  onChange,
  disabled = false,
  minDate,
  maxDate,
  placeholder,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const { formatDate } = useDateTimeFormatters()
  const resolvedPlaceholder = placeholder ?? t('common.datePicker.selectDate');
  const selectedDate = value ? parseDateOnly(value) : undefined;

  const currentYear = new Date().getFullYear();
  const startMonth = new Date(currentYear - 20, 0);
  const endMonth = new Date(currentYear + 20, 11);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(toLocalDateString(date));
      setOpen(false);
    }
  };

  // Shared across both presentations so the trigger and calendar stay identical.
  const triggerButton = (
    <Button
      id={id}
      type="button"
      variant="outline"
      disabled={disabled}
      aria-invalid={ariaInvalid}
      className={cn(
        "w-full justify-start text-left font-normal",
        !value && "text-muted-foreground"
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value ? formatDate(value) : resolvedPlaceholder}
    </Button>
  );

  const calendar = (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleSelect}
      startMonth={startMonth}
      endMonth={endMonth}
      disabled={(date) => {
        if (minDate && date < parseDateOnly(minDate)) return true;
        if (maxDate && date > parseDateOnly(maxDate)) return true;
        return false;
      }}
      autoFocus
    />
  );

  // Mobile: bottom Sheet instead of a Popover. The modal Popover swallows touches
  // on iOS, so the month/year dropdowns won't open inside it; a Sheet (Radix Dialog)
  // accepts taps normally.
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-xl px-6 pb-8">
            <SheetHeader className="text-left px-0">
              <SheetTitle>{resolvedPlaceholder}</SheetTitle>
            </SheetHeader>
            <div className="flex justify-center">{calendar}</div>
          </SheetContent>
      </Sheet>
    );
  }

  // Desktop: unchanged Popover.
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" style={{ pointerEvents: 'auto' }}>
        {calendar}
      </PopoverContent>
    </Popover>
  );
}