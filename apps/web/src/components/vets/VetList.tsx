import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, Stethoscope, Loader2 } from 'lucide-react';
import {
  useVeterinarians,
  useCreateVeterinarian,
  useUpdateVeterinarian,
  useDeleteVeterinarian,
  useAssignVetToPets,
  useUnassignVetFromPets,
} from '@/queries/vets';
import VetCard from './VetCard';
import VetForm from './VetForm';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';
import { AppointmentTracker } from './appointments';
import { vetErrorHandler, vetApi } from '@/lib/api';
import { PageTitle, EmptyStateTitle, EmptyStateDescription, MutedText } from '@/components/ui/typography';
import { VetListSkeleton } from '@/components/ui/skeletons/VetSkeleton';

export default function VetList() {
  const { data: vets, error } = useVeterinarians();
  const createVetMutation = useCreateVeterinarian();
  const updateVetMutation = useUpdateVeterinarian();
  const deleteVetMutation = useDeleteVeterinarian();
  const assignVetMutation = useAssignVetToPets();
  const unassignVetMutation = useUnassignVetFromPets();

  // Computed loading state for any mutation in progress
  const isActionLoading =
    createVetMutation.isPending ||
    updateVetMutation.isPending ||
    deleteVetMutation.isPending ||
    assignVetMutation.isPending ||
    unassignVetMutation.isPending;

  // UI State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVet, setEditingVet] = useState<Veterinarian | null>(null);
  const [deletingVet, setDeletingVet] = useState<Veterinarian | null>(null);

  // Handle create vet
  const handleCreateVet = async (
    vetData: VeterinarianFormData,
    petIds?: string[],
  ): Promise<Veterinarian | null> => {
    try {
      const result = await createVetMutation.mutateAsync({
        vetData,
        petIds,
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
  ): Promise<Veterinarian | null> => {
    if (!editingVet) return null;

    try {
      // Update vet basic info
      const result = await updateVetMutation.mutateAsync({
        vetId: editingVet.id,
        vetData,
      });

      // Handle pet assignments if provided
      if (petIds !== undefined) {
        // Get current assignments
        const currentAssignments = await vetApi.getVetPets(editingVet.id);
        const currentPetIds = currentAssignments.map(a => a.petId);

        // Determine which pets to assign and unassign
        const petsToAssign = petIds.filter(id => !currentPetIds.includes(id));
        const petsToUnassign = currentPetIds.filter(id => !petIds.includes(id));

        // Use mutations for assign/unassign
        if (petsToAssign.length > 0) {
          await assignVetMutation.mutateAsync({
            vetId: editingVet.id,
            petIds: petsToAssign,
          });
        }

        if (petsToUnassign.length > 0) {
          await unassignVetMutation.mutateAsync({
            vetId: editingVet.id,
            petIds: petsToUnassign,
          });
        }
      }

      setEditingVet(null);
      return result;
    } catch (error) {
      // Error already handled in mutation
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
  if (vets === undefined) { return <VetListSkeleton />; }

  // Error state
  if (error) {
    const appError = vetErrorHandler(error);
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="text-center space-y-2">
              <EmptyStateTitle>Unable to load veterinarians</EmptyStateTitle>
              <MutedText>{appError.message}</MutedText>
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
              <EmptyStateTitle>No veterinarians yet</EmptyStateTitle>
                <EmptyStateDescription className="max-w-md">
                  Add your first veterinarian to keep track...
                </EmptyStateDescription>
              </div>
                <Button className="mt-4" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Your First Veterinarian
                </Button>
                <ResponsiveDialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                  title="Add New Veterinarian"
                  description="Fill out the veterinarian's information below. Fields marked with * are required."
                >
                  <VetForm
                    onSubmit={handleCreateVet}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    isLoading={isActionLoading}
                  />
                </ResponsiveDialog>
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
            <PageTitle>My Veterinarians</PageTitle>
            <MutedText>Manage your pets&apos; vets</MutedText>
          </div>
          {/* <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vet
          </Button> */}
          <ResponsiveDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            title="Add New Veterinarian"
            description="Fill out the veterinarian's information below. Fields marked with * are required."
          >
            <VetForm
              onSubmit={handleCreateVet}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={isActionLoading}
            />
          </ResponsiveDialog>
        </div>

        {/* Vets Grid */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Stethoscope className="h-4 w-4" />
                My Vets ({vets.length})
              </CardTitle>
              <Button 
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Vet</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {vets.map((vet) => (
                <VetCard
                  key={vet.id}
                  vet={vet}
                  onEdit={setEditingVet}
                  onDelete={setDeletingVet}
                />
              ))}
            </div>
          </CardContent>
        </Card>

                
        {/* Appointments Section - Full Width Below Vets */}   
        <AppointmentTracker />

        {/* Edit Dialog */}
        <ResponsiveDialog
          open={!!editingVet}
          onOpenChange={(open) => { if (!open) setEditingVet(null); }}
          title="Edit Veterinarian"
          description="Update the veterinarian's information below."
        >
          {editingVet && (
            <VetForm
              vet={editingVet}
              onSubmit={handleUpdateVet}
              onCancel={() => setEditingVet(null)}
              isLoading={isActionLoading}
            />
          )}
        </ResponsiveDialog>

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