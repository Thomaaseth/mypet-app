import { Controller } from 'react-hook-form';
import { useAntiParasiteForm } from '@/hooks/useAntiParasiteForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DatePicker } from '@/components/ui/date-picker';
import { ErrorText, HelperText } from '@/components/ui/typography';
import { Loader2, Info } from 'lucide-react';
import { getTodayDateString } from '@/lib/utils/date-formatting';
import { useTranslation } from 'react-i18next';
import type { TranslationKey } from '@/i18n/translation-key';
import {
  ANTI_PARASITE_CATEGORIES,
  ANTI_PARASITE_DURATION_OPTIONS,
  encodeDurationOption,
  decodeDurationOption,
  type AntiParasiteCategory,
  type AntiParasiteTreatmentFormFields,
} from '@/lib/validations/anti-parasite-treatment';
import {
  ANTI_PARASITE_CATEGORY_KEYS,
  ANTI_PARASITE_DURATION_OPTION_KEYS,
} from '@/i18n/enum-keys';
import type { AntiParasiteTreatment, AntiParasiteTreatmentFormData } from '@/types/anti-parasite-treatments';

interface AntiParasiteFormProps {
  treatment?: AntiParasiteTreatment;
  renewFrom?: AntiParasiteTreatment;
  onSubmit: (data: AntiParasiteTreatmentFormData) => Promise<AntiParasiteTreatment | null>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function AntiParasiteForm({
  treatment,
  renewFrom,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel,
}: AntiParasiteFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useAntiParasiteForm({ treatment, renewFrom });

  // Split the single dropdown string back into the two API fields at the
  // submit boundary (decode is guaranteed non-null here: the form schema
  // already rejected empty/unknown duration before we reach onSubmit).
  const onFormSubmit = async (data: AntiParasiteTreatmentFormFields) => {
    const decoded = decodeDurationOption(data.duration);
    if (!decoded) return; // defensive; resolver prevents this
    const payload: AntiParasiteTreatmentFormData = {
      productName: data.productName,
      categories: data.categories,
      durationUnit: decoded.durationUnit,
      durationAmount: decoded.durationAmount,
      dateAdministered: data.dateAdministered,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
      {/* Categories — multi-select, at least one required */}
      <div className="space-y-2">
        <Label>{t('antiParasite.form.categoriesLabel')}</Label>
        <Controller
          name="categories"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              {ANTI_PARASITE_CATEGORIES.map((category: AntiParasiteCategory) => {
                const checked = field.value?.includes(category) ?? false;
                return (
                  <div
                    key={category}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`category-${category}`}
                      checked={checked}
                      onCheckedChange={(isChecked) => {
                        if (isChecked) {
                          field.onChange([...(field.value ?? []), category]);
                        } else {
                          field.onChange((field.value ?? []).filter((c) => c !== category));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`category-${category}`}
                      className="cursor-pointer font-normal flex-1"
                    >
                      {t(ANTI_PARASITE_CATEGORY_KEYS[category])}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
        />
        {errors.categories && (
          <ErrorText>{t(errors.categories.message as TranslationKey)}</ErrorText>
        )}
      </div>

      {/* Product name */}
      <div className="space-y-2">
        <Label htmlFor="productName">{t('antiParasite.form.productNameLabel')}</Label>
        <Input
          id="productName"
          placeholder={t('antiParasite.form.productNamePlaceholder')}
          maxLength={50}
          {...register('productName')}
          aria-invalid={!!errors.productName}
        />
        {errors.productName && (
          <ErrorText>{t(errors.productName.message as TranslationKey)}</ErrorText>
        )}
      </div>

      {/* Duration — single dropdown, empty by default (must be chosen) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="duration">{t('antiParasite.form.durationLabel')}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground" aria-label={t('antiParasite.form.durationTooltipAria')}>
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {t('antiParasite.form.durationTooltip')}
            </TooltipContent>
          </Tooltip>
        </div>
        <Controller
          name="duration"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="duration" aria-invalid={!!errors.duration}>
                <SelectValue placeholder={t('antiParasite.form.durationPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {ANTI_PARASITE_DURATION_OPTIONS.map((option) => {
                  const value = encodeDurationOption(option);
                  return (
                    <SelectItem key={value} value={value}>
                      {t(ANTI_PARASITE_DURATION_OPTION_KEYS[value as keyof typeof ANTI_PARASITE_DURATION_OPTION_KEYS])}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        />
        {errors.duration && <ErrorText>{t(errors.duration.message as TranslationKey)}</ErrorText>}
      </div>

      {/* Date administered */}
      <div className="space-y-2">
        <Label htmlFor="dateAdministered">{t('antiParasite.form.dateLabel')}</Label>
        <Controller
          name="dateAdministered"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="dateAdministered"
              value={field.value}
              onChange={field.onChange}
              maxDate={getTodayDateString()}
              aria-invalid={!!errors.dateAdministered}
            />
          )}
        />
        {errors.dateAdministered && (
          <ErrorText>{t(errors.dateAdministered.message as TranslationKey)}</ErrorText>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('common.actions.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel ?? t('antiParasite.form.addButton')}
        </Button>
      </div>
    </form>
  );
}