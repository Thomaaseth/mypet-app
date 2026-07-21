import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePreferencesContext } from "@/contexts/UserPreferencesContext"
import { getFallbackDateTimeLocale } from "@/lib/utils/locale"
import { formatDateForDisplay, parseDateOnly, toLocalDateString } from "@/lib/utils/date-formatting"

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
  placeholder = "Select a date",
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { dateTimeLocale } = usePreferencesContext();
  const displayLocale = dateTimeLocale ?? getFallbackDateTimeLocale();

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
          {value ? formatDateForDisplay(value, displayLocale) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" style={{ pointerEvents: 'auto' }}>
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
      </PopoverContent>
    </Popover>
  );
}