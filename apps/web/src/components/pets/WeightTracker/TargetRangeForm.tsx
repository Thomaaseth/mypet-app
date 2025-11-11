import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { WeightUnit } from '@/types/pet';
import type { WeightTargetFormData } from '@/types/weight-targets';

interface TargetRangeFormProps {
  petId: string;
  petName: string;
  weightUnit: WeightUnit;
  currentMin?: number;
  currentMax?: number;
  onSubmit: (data: WeightTargetFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

// Validation schema
const createTargetRangeSchema = (weightUnit: WeightUnit) => {
  const maxWeight = weightUnit === 'kg' ? 200 : 440;
  
  return z.object({
    minWeight: z
      .string()
      .min(1, 'Minimum weight is required')
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      }, 'Minimum weight must be a positive number')
      .refine((val) => {
        const num = parseFloat(val);
        return num <= maxWeight;
      }, `Minimum weight must not exceed ${maxWeight} ${weightUnit}`),
    maxWeight: z
      .string()
      .min(1, 'Maximum weight is required')
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      }, 'Maximum weight must be a positive number')
      .refine((val) => {
        const num = parseFloat(val);
        return num <= maxWeight;
      }, `Maximum weight must not exceed ${maxWeight} ${weightUnit}`),
    weightUnit: z.enum(['kg', 'lbs']),
  }).refine((data) => {
    const min = parseFloat(data.minWeight);
    const max = parseFloat(data.maxWeight);
    return max > min;
  }, {
    message: 'Maximum weight must be greater than minimum weight',
    path: ['maxWeight'],
  });
};

type TargetRangeFormData = z.infer<ReturnType<typeof createTargetRangeSchema>>;

export default function TargetRangeForm({
  petName,
  weightUnit,
  currentMin,
  currentMax,
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false,
  error,
}: TargetRangeFormProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditing = currentMin !== undefined && currentMax !== undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TargetRangeFormData>({
    resolver: zodResolver(createTargetRangeSchema(weightUnit)),
    defaultValues: {
      minWeight: currentMin?.toString() || '',
      maxWeight: currentMax?.toString() || '',
      weightUnit,
    },
  });

  const onFormSubmit = async (formData: TargetRangeFormData) => {
    await onSubmit({
      minWeight: formData.minWeight,
      maxWeight: formData.maxWeight,
      weightUnit: formData.weightUnit,
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Minimum Weight */}
        <div className="space-y-2">
          <Label htmlFor="minWeight">Minimum Weight *</Label>
          <Input
            id="minWeight"
            type="number"
            step="0.01"
            min="0"
            placeholder={`Enter minimum weight`}
            {...register('minWeight')}
            aria-invalid={!!errors.minWeight}
          />
          {errors.minWeight && (
            <p className="text-sm text-destructive">{errors.minWeight.message}</p>
          )}
        </div>

        {/* Maximum Weight */}
        <div className="space-y-2">
          <Label htmlFor="maxWeight">Maximum Weight *</Label>
          <Input
            id="maxWeight"
            type="number"
            step="0.01"
            min="0"
            placeholder={`Enter maximum weight`}
            {...register('maxWeight')}
            aria-invalid={!!errors.maxWeight}
          />
          {errors.maxWeight && (
            <p className="text-sm text-destructive">{errors.maxWeight.message}</p>
          )}
        </div>

        {/* Weight Unit (Read-only) */}
        <div className="space-y-2">
          <Label htmlFor="weightUnit">Weight Unit</Label>
          <Input
            id="weightUnit"
            type="text"
            value={weightUnit}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Unit is determined by your weight entries
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4">
          {/* Delete Button (only when editing) */}
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading || isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Target
            </Button>
          )}
          
          {/* Spacer if not editing */}
          {!isEditing && <div />}

          {/* Cancel & Save */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isDeleting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isDeleting}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete target range?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the target weight range for {petName} from the chart. 
              You can always set it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}