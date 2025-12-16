import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Stethoscope, Loader2 } from 'lucide-react';
import {
  useVeterinarians,
  useCreateVeterinarian,
  useUpdateVeterinarian,
  useDeleteVeterinarian,
} from '@/queries/vets';
import VetCard from './VetCard';
import VetForm from './VetForm';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';
import { vetErrorHandler } from '@/lib/api';

export default function VetList() {
  const { data: vets, isPending, error } = useVeterinarians();
  const createVetMutation = useCreateVeterinarian();
  const updateVetMutation = useUpdateVeterinarian();
  const deleteVetMutation = useDeleteVeterinarian();

  // Computed loading state for any mutation in progress
  const isActionLoading =
    createVetMutation.isPending ||
    updateVetMutation.isPending ||
    deleteVetMutation.isPending;

  // UI State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVet, setEditingVet] = useState<Veterinarian | null>(null);
  const [deletingVet, setDeletingVet] = useState<Veterinarian | null>(null);

  // Handle create vet
  const handleCreateVet = async (
    vetData: VeterinarianFormData,
    petIds?: string[],
    isPrimaryForPet?: boolean,
  ): Promise<Veterinarian | null> => {
    try {
      const result = await createVetMutation.mutateAsync({
        vetData,
        petIds,
        isPrimaryForPet,
      });
      setIsCreateDialogOpen(false);
      return result;
    } catch (error) {
      // Error already handled in mutation
      return null;
    }
  };

  // Handle update vet
  const handleUpdateVet = async (
    vetData: VeterinarianFormData,
    petIds?: string[],
    isPrimaryForPet?: boolean
  ): Promise<Veterinarian | null> => {
    if (!editingVet) return null;
  
    try {
      const result = await updateVetMutation.mutateAsync({
        vetId: editingVet.id,
        vetData,
      });
      
      // Handle pet assignments separately if provided
      if (petIds !== undefined) {
        // This would require additional mutations - for now we'll skip
        // You can add this in phase 2 if needed
      }
      
      setEditingVet(null);
      return result;
    } catch (error) {
      return null;
    }
  };

  // Handle delete vet
  const handleDeleteVet = async () => {
    if (!deletingVet) return;

    try {
      await deleteVetMutation.mutateAsync(deletingVet.id);
      setDeletingVet(null);
    } catch (error) {
      // Error already handled in mutation
    }
  };

  // Loading state
  if (isPending) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const appError = vetErrorHandler(error);
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Unable to load veterinarians</h3>
              <p className="text-muted-foreground">{appError.message}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!vets || vets.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No veterinarians yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Add your first veterinarian to keep track of your pets' healthcare
                  providers and their contact information.
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Veterinarian
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Veterinarian</DialogTitle>
                    <DialogDescription>
                      Fill out the veterinarian&apos;s information below. Fields marked
                      with * are required.
                    </DialogDescription>
                  </DialogHeader>
                  <VetForm
                    onSubmit={handleCreateVet}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    isLoading={isActionLoading}
                    />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content with vets
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">My Veterinarians</h1>
            <p className="text-muted-foreground">
              Manage your pets' healthcare providers
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Veterinarian
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Veterinarian</DialogTitle>
                <DialogDescription>
                  Fill out the veterinarian&apos;s information below. Fields marked with
                  * are required.
                </DialogDescription>
              </DialogHeader>
              <VetForm
                onSubmit={handleCreateVet}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={isActionLoading}
                />
            </DialogContent>
          </Dialog>
        </div>

        {/* Vets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vets.map((vet) => (
            <VetCard
              key={vet.id}
              vet={vet}
              onEdit={setEditingVet}
              onDelete={setDeletingVet}
            />
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingVet} onOpenChange={() => setEditingVet(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Veterinarian</DialogTitle>
              <DialogDescription>
                Update the veterinarian&apos;s information below.
              </DialogDescription>
            </DialogHeader>
            {editingVet && (
              <VetForm
                vet={editingVet}
                onSubmit={handleUpdateVet}
                onCancel={() => setEditingVet(null)}
                isLoading={isActionLoading}
                />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingVet}
          onOpenChange={() => setDeletingVet(null)}
          >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove {deletingVet?.clinicName || deletingVet?.vetName} from
                your veterinarians list. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteVet}
                disabled={isActionLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}