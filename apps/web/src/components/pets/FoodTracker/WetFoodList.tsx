import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit2, Trash2, Calendar, Package, Utensils, MoreHorizontal, CheckSquare } from 'lucide-react';
import { WetFoodForm } from './WetFoodForm';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';
import { formatDateForDisplay } from '@/lib/utils/date-formatting';
import { FoodHistorySection } from './FoodHistorySection';
import { MarkAsFinishedDialog } from './MarkAsFinishedDialog';
import { formatRemainingWeight, formatFoodQuantity } from '@/lib/utils/food-formatting';
import { StatLabel, StatValue, MutedText, SectionTitle } from '@/components/ui/typography';
import { FoodUnitLabel } from './FoodUnitLabel'
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getFallbackDateTimeLocale } from '@/lib/utils/locale';
import { convertFoodWeight } from '@/lib/validations/pet';

// Type guard to ensure active entries have required calculated fields
function isValidActiveEntry(entry: WetFoodEntry): entry is WetFoodEntry & {
  remainingDays: number;
  remainingWeight: number;
  depletionDate: string;
} {
  return (
    entry.isActive &&
    entry.remainingDays !== undefined &&
    entry.remainingWeight !== undefined &&
    entry.depletionDate !== undefined
  );
}

interface WetFoodListProps {
  entries: WetFoodEntry[];
  finishedEntries: WetFoodEntry[];
  onUpdate: (foodId: string, data: Partial<WetFoodFormData>) => Promise<WetFoodEntry | null>;
  onDelete: (foodId: string) => Promise<boolean>;
  onMarkAsFinished: (foodId: string) => Promise<boolean>;
  onUpdateFinishDate: (foodId: string, dateFinished: string) => Promise<WetFoodEntry | null>;
  isLoading?: boolean;
}
export function WetFoodList({ 
  entries, 
  finishedEntries, 
  onUpdate, 
  onDelete, 
  onMarkAsFinished,
  onUpdateFinishDate,
  isLoading = false 
}: WetFoodListProps) {
 const [editingEntry, setEditingEntry] = useState<WetFoodEntry | null>(null);
 const [deletingEntry, setDeletingEntry] = useState<WetFoodEntry | null>(null);
 const [markingFinishedEntry, setMarkingFinishedEntry] = useState<WetFoodEntry | null>(null);

 const { dateTimeLocale, units } = usePreferencesContext();
 const displayLocale = dateTimeLocale ?? getFallbackDateTimeLocale();
 const wetFoodUnit = units?.wetFoodUnit ?? 'grams';

 const handleUpdate = async (data: WetFoodFormData) => { // Receive WetFoodFormData (strings)
  if (!editingEntry) return null;
   
  const result = await onUpdate(editingEntry.id, data); // Pass strings directly
  if (result) {
    setEditingEntry(null);
  }
  return result;
 };

 const handleDelete = async () => {
   if (!deletingEntry) return;
   
   const success = await onDelete(deletingEntry.id);
   if (success) {
     setDeletingEntry(null);
   }
 };

  const getStatusSection = (entry: WetFoodEntry & { 
    remainingDays: number; 
    remainingWeight: number; 
    depletionDate: string;
  }) => {
    const isCalculatedFinished = entry.remainingDays <= 0;
    
    if (isCalculatedFinished) {
      return <Badge variant="destructive">Finished</Badge>;
    } else if (entry.remainingDays <= 7) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };


 const calculateTotalWeight = (entry: WetFoodEntry) => {
   return entry.numberOfUnits * parseFloat(entry.weightPerUnit);
 };

 const getProgressPercentage = (entry: WetFoodEntry & { 
  remainingDays: number; 
  remainingWeight: number; 
  depletionDate: string;
  }) => {
   const totalWeight = calculateTotalWeight(entry);
   if (totalWeight === 0) return 0;
   return Math.max(0, Math.min(100, (entry.remainingWeight / totalWeight) * 100));
 };

const validActiveEntries = entries.filter(isValidActiveEntry);

if (validActiveEntries.length === 0 && finishedEntries.length === 0) {
  return null;
}

 return (
   <>
     {/* Active Entries Section */}
     {validActiveEntries.length > 0 && (
       <div className="grid gap-4">
         {validActiveEntries.map((entry) => {
           const totalWeight = calculateTotalWeight(entry);
           const progressPercentage = getProgressPercentage(entry);
           
           return (
             <Card key={entry.id} className="relative">
               <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <SectionTitle>
                        {entry.brandName && entry.productName
                          ? `${entry.brandName} - ${entry.productName}`
                          : entry.brandName || entry.productName || 'Wet Food'}
                      </SectionTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusSection(entry)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMarkingFinishedEntry(entry)}>
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Mark As Finished
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingEntry(entry)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex flex-wrap @min-[240px]:flex-nowrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 shrink-0">
                      <Package className="h-4 w-4" />
                      <span>
                        {entry.numberOfUnits}x{formatFoodQuantity(convertFoodWeight(parseFloat(entry.weightPerUnit), 'grams', wetFoodUnit).toString())} <FoodUnitLabel unit={wetFoodUnit} />
                      </span>
                      </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Utensils className="h-4 w-4" />
                      <span>
                        {formatFoodQuantity(convertFoodWeight(parseFloat(entry.dailyAmount), 'grams', wetFoodUnit).toString())} <FoodUnitLabel unit={wetFoodUnit} />/day
                      </span>
                      </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="h-4 w-4" />
                      {formatDateForDisplay(entry.dateStarted, displayLocale)}
                    </span>
                  </div>
                </CardHeader>
               <CardContent>
               <div className="grid grid-cols-2 @min-[320px]:grid-cols-3 gap-6 @min-[320px]:gap-4 mb-4">
               <div>
                    <StatLabel>~Remaining</StatLabel>
                      <StatValue>
                        {formatRemainingWeight(convertFoodWeight(entry.remainingWeight, 'grams', wetFoodUnit))} <FoodUnitLabel unit={wetFoodUnit} />
                      </StatValue>
                    </div>
                   <div>
                    <StatLabel>~Days Left</StatLabel>
                    <StatValue>{entry.remainingDays > 0 ? entry.remainingDays : 0}</StatValue>
                   </div>
                   <div>
                    <StatLabel>~Runs out</StatLabel>
                    <StatValue>{formatDateForDisplay(entry.depletionDate, displayLocale)}</StatValue>
                   </div>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progressPercentage > 50 
                        ? 'bg-secondary' 
                        : progressPercentage > 20
                        ? 'bg-accent' 
                        : 'bg-primary'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
               </CardContent>
             </Card>
           );
         })}
       </div>
     )}

     {/* History Section - Always show if there are finished entries */}
     {finishedEntries.length > 0 && (
      <div className="mt-2">
       <FoodHistorySection 
         entries={finishedEntries}
         foodType="wet"
         onEditFinishDate={onUpdateFinishDate}
         onDelete={onDelete}
       />
      </div>
     )}

     {/* Edit Dialog */}
     <ResponsiveDialog
        open={!!editingEntry}
        onOpenChange={() => setEditingEntry(null)}
        title="Edit Wet Food Entry"
        description="Update the details for this wet food entry."
      >
         {editingEntry && (
           <WetFoodForm
             wetFoodEntry={editingEntry}
             onSubmit={handleUpdate}
             isLoading={isLoading}
             submitLabel="Update Wet Food"
           />
         )}
       </ResponsiveDialog>

     {markingFinishedEntry && (
      <MarkAsFinishedDialog
        entry={markingFinishedEntry}
        isOpen={!!markingFinishedEntry}
        onClose={() => setMarkingFinishedEntry(null)}
        onConfirm={onMarkAsFinished}
        isLoading={isLoading}
      />
    )}

     {/* Delete Confirmation */}
     <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>Delete Wet Food Entry</AlertDialogTitle>
           <AlertDialogDescription>
             Are you sure you want to delete this wet food entry for{' '}
             <span className="font-semibold">
               {deletingEntry?.brandName && deletingEntry?.productName 
                 ? `${deletingEntry.brandName} - ${deletingEntry.productName}`
                 : deletingEntry?.brandName || deletingEntry?.productName || 'this wet food'}
             </span>
             ? This action cannot be undone.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
           <AlertDialogAction 
             onClick={handleDelete} 
             disabled={isLoading}
             className="bg-red-600 hover:bg-red-700"
           >
             {isLoading ? (
               <>
                 <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                 Deleting...
               </>
             ) : (
               'Delete'
             )}
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   </>
 );
}