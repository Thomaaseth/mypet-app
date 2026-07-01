import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronRight } from 'lucide-react';
// import type { WeightUnit } from '@/types/pet';
import type { WeightTargetFormData } from '@/types/weight-targets';
import { createWeightTargetSchema } from '@/lib/validations/weight';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { convertWeight } from '@/lib/validations/pet';

interface TargetRangeFormProps {
  petName: string;
  animalType: 'cat' | 'dog';
  // weightUnit: WeightUnit;
  currentMin?: number; // kg from API
  currentMax?: number; // kg from API
  onSubmit: (data: WeightTargetFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function TargetRangeForm({
  petName,
  animalType,
  // weightUnit,
  currentMin,
  currentMax,
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false,
  error,
}: TargetRangeFormProps) {
  const { units } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? 'kg';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditing = currentMin !== undefined && currentMax !== undefined;

  // Convert kg values from API to display unit for form pre-fill
  const displayMin = currentMin !== undefined
    ? parseFloat(convertWeight(currentMin, 'kg', weightUnit).toFixed(3)).toString()
    : '';
  const displayMax = currentMax !== undefined
    ? parseFloat(convertWeight(currentMax, 'kg', weightUnit).toFixed(3)).toString()
    : '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WeightTargetFormData>({
    resolver: zodResolver(createWeightTargetSchema(animalType)),
    shouldFocusError: false,
    defaultValues: {
      minWeight: displayMin,
      maxWeight: displayMax,
      weightUnit,
    },
  });

  const onFormSubmit = async (formData: WeightTargetFormData) => {
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
        <Label htmlFor="minWeight">Minimum Weight ({weightUnit})</Label>
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
        <Label htmlFor="maxWeight">Maximum Weight ({weightUnit})</Label>
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
        {/* <div className="space-y-2">
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
        </div> */}

        {/* Educational Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="why-set-range" className="border-0">
            <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2 hover:no-underline">
              Why set a target range?
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-muted/50 rounded-md p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  A healthy weight range helps you monitor if your pet is underweight, 
                  overweight, or right on track. Your veterinarian can provide the best 
                  guidance based on:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Breed and body type</li>
                  <li>Age and activity level</li>
                  <li>Overall health condition</li>
                </ul>
                <div className="bg-background border border-border rounded-md p-3">
                  <p className="text-sm font-medium">
                    Ask your vet &quot;What&apos;s a healthy weight 
                    range for your pet.&quot; Then add it to the app.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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