// apps/web/src/components/pets/FoodTracker/WetFoodList.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
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
import { Edit, Trash2, Calendar, Package, Utensils } from 'lucide-react';
import { WetFoodForm } from './WetFoodForm';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';
import { formatDateForDisplay } from '@/lib/validations/food';

interface WetFoodListProps {
  entries: WetFoodEntry[];
  onUpdate: (foodId: string, data: Partial<WetFoodFormData>) => Promise<WetFoodEntry | null>;
  onDelete: (foodId: string) => Promise<boolean>;
  isLoading?: boolean;
}
export function WetFoodList({ entries, onUpdate, onDelete, isLoading = false }: WetFoodListProps) {
 const [editingEntry, setEditingEntry] = useState<WetFoodEntry | null>(null);
 const [deletingEntry, setDeletingEntry] = useState<WetFoodEntry | null>(null);

 const handleUpdate = async (data: WetFoodFormData) => { // ✅ Receive WetFoodFormData (strings)
  if (!editingEntry) return null;
   
  const result = await onUpdate(editingEntry.id, data); // ✅ Pass strings directly
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

 const getStatusBadge = (entry: WetFoodEntry) => {
   if (entry.remainingDays <= 0) {
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

 const getProgressPercentage = (entry: WetFoodEntry) => {
   const totalWeight = calculateTotalWeight(entry);
   if (totalWeight === 0) return 0;
   return Math.max(0, Math.min(100, (entry.remainingWeight / totalWeight) * 100));
 };

 if (entries.length === 0) {
   return (
     <Card>
       <CardContent className="pt-6">
         <div className="text-center text-muted-foreground">
           <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
           <p>No wet food entries yet.</p>
           <p className="text-sm">Add your first pack of wet food to start tracking!</p>
         </div>
       </CardContent>
     </Card>
   );
 }

 return (
   <>
     <div className="grid gap-4">
       {entries.map((entry) => {
         const totalWeight = calculateTotalWeight(entry);
         const progressPercentage = getProgressPercentage(entry);
         
         return (
           <Card key={entry.id} className="relative">
             <CardHeader className="pb-3">
               <div className="flex justify-between items-start">
                 <div className="flex-1">
                   <CardTitle className="text-lg">
                     {entry.brandName && entry.productName 
                       ? `${entry.brandName} - ${entry.productName}`
                       : entry.brandName || entry.productName || 'Wet Food'}
                   </CardTitle>
                   <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                     <span className="flex items-center gap-1">
                       <Package className="h-4 w-4" />
                       {entry.numberOfUnits} × {entry.weightPerUnit} {entry.wetWeightUnit}
                     </span>
                     <span className="flex items-center gap-1">
                       <Utensils className="h-4 w-4" />
                       {entry.dailyAmount} {entry.wetDailyAmountUnit}/day
                     </span>
                     <span className="flex items-center gap-1">
                       <Calendar className="h-4 w-4" />
                       {formatDateForDisplay(entry.datePurchased)}
                     </span>
                   </div>
                 </div>
                 <div className="flex items-center gap-2 ml-4">
                   {getStatusBadge(entry)}
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setEditingEntry(entry)}
                     disabled={isLoading}
                     className="h-8 w-8 p-0"
                   >
                     <Edit className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setDeletingEntry(entry)}
                     disabled={isLoading}
                     className="h-8 w-8 p-0"
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                 <div>
                   <p className="font-medium text-muted-foreground">Total Weight</p>
                   <p className="text-lg font-semibold">
                     {totalWeight.toFixed(1)} {entry.wetWeightUnit}
                   </p>
                 </div>
                 <div>
                   <p className="font-medium text-muted-foreground">Remaining</p>
                   <p className="text-lg font-semibold">
                     {entry.remainingWeight.toFixed(1)} {entry.wetWeightUnit}
                   </p>
                 </div>
                 <div>
                   <p className="font-medium text-muted-foreground">Days Left</p>
                   <p className="text-lg font-semibold">
                     {entry.remainingDays > 0 ? entry.remainingDays : 0}
                   </p>
                 </div>
                 <div>
                   <p className="font-medium text-muted-foreground">Depletion Date</p>
                   <p className="text-lg font-semibold">
                     {formatDateForDisplay(entry.depletionDate)}
                   </p>
                 </div>
               </div>
               
               {/* Progress Bar */}
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <p className="font-medium text-muted-foreground text-sm">Progress</p>
                   <p className="text-sm text-muted-foreground">
                     {progressPercentage.toFixed(1)}% remaining
                   </p>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-2">
                   <div 
                     className={`h-2 rounded-full transition-all duration-300 ${
                       progressPercentage > 50 
                         ? 'bg-green-600' 
                         : progressPercentage > 25 
                         ? 'bg-yellow-600' 
                         : 'bg-red-600'
                     }`}
                     style={{ width: `${progressPercentage}%` }}
                   />
                 </div>
               </div>
             </CardContent>
           </Card>
         );
       })}
     </div>

     {/* Edit Dialog */}
     <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
       <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Edit Wet Food Entry</DialogTitle>
           <DialogDescription>
             Update the details for this wet food entry.
           </DialogDescription>
         </DialogHeader>
         {editingEntry && (
           <WetFoodForm
             initialData={{
               brandName: editingEntry.brandName || '',
               productName: editingEntry.productName || '',
               numberOfUnits: editingEntry.numberOfUnits.toString(),
               weightPerUnit: editingEntry.weightPerUnit,
               wetWeightUnit: editingEntry.wetWeightUnit,
               dailyAmount: editingEntry.dailyAmount,
               wetDailyAmountUnit: editingEntry.wetDailyAmountUnit,
               datePurchased: editingEntry.datePurchased,
             }}
             onSubmit={handleUpdate}
             isLoading={isLoading}
             submitLabel="Update Wet Food"
           />
         )}
       </DialogContent>
     </Dialog>

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