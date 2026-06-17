import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Heart, Loader2 } from 'lucide-react';
import { usePets, useCreatePet, useUpdatePet, useDeletePet, usePetSignedUrl } from '@/queries/pets';
import PetCard from './PetCard';
import PetForm from './PetForm';
import type { Pet, PetFormData } from '@/types/pet';
import { petErrorHandler } from '@/lib/api/domains/pets';
import { PetListSkeleton } from '@/components/ui/skeletons/PetSkeleton';
import { WeightTracker } from './WeightTracker';
import { FoodTracker } from './FoodTracker';
import NotesWidget from './NotesWidget/NotesWidget';
import { PageTitle, EmptyStateTitle, EmptyStateDescription, MutedText } from '@/components/ui/typography';

function EditPetForm({ 
  pet, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  pet: Pet; 
  onSubmit: (data: PetFormData) => Promise<Pet | null>; 
  onCancel: () => void; 
  isLoading: boolean; 
}) {
  const { data: signedUrl } = usePetSignedUrl(pet.id, Boolean(pet.imageUrl));
  return (
    <PetForm
      pet={pet}
      signedUrl={signedUrl ?? null}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
    />
  );
}

export default function PetList() {
  const { data: pets, isPending, error } = usePets();
  const createPetMutation = useCreatePet();
  const updatePetMutation = useUpdatePet();
  const deletePetMutation = useDeletePet();

  // Computed loading state for any mutation in progress
  const isActionLoading = createPetMutation.isPending || 
                          updatePetMutation.isPending || 
                          deletePetMutation.isPending;
  
  // UI State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [userSelectedTab, setUserSelectedTab] = useState<string | null>(null);
  
  const activeTab = userSelectedTab ?? pets?.[0]?.id ?? '';


  // Handle create pet
  const handleCreatePet = async (petData: PetFormData): Promise<Pet | null> => {
    try {
      const result = await createPetMutation.mutateAsync(petData);
      setIsCreateDialogOpen(false);
      return result;
    } catch (error) {
      // Error already handled in mutation
      return null;
    }
  };

  // Handle update pet
  const handleUpdatePet = async (petData: PetFormData): Promise<Pet | null> => {
    if (!editingPet) return null;
    
    try {
      const result = await updatePetMutation.mutateAsync({
        petId: editingPet.id,
        petData
      });
      setEditingPet(null);
      return result;
    } catch (error) {
      // Error already handled in mutation
      return null;
    }
  };

  // Handle delete pet
  const handleDeletePet = async () => {
    if (!deletingPet || !pets) return;
    
    try {
      const deletedPetId = deletingPet.id;
      
      // Find the index of the pet being deleted
      const deletedIndex = pets.findIndex((p) => p.id === deletedPetId);
      
      // Determine which pet to navigate to after deletion
      let nextPetId: string | null = null;
      
      if (pets.length > 1) {
        // If there are other pets, navigate to the next one
        if (deletedIndex < pets.length - 1) {
          // Navigate to the next pet (same index after deletion)
          nextPetId = pets[deletedIndex + 1].id;
        } else {
          // We're deleting the last pet, navigate to the previous one
          nextPetId = pets[deletedIndex - 1].id;
        }
      }
      
      // Perform the deletion
      await deletePetMutation.mutateAsync(deletedPetId);
      
      // Update active tab to the next pet (or empty if no pets left)
      setUserSelectedTab(nextPetId || '');
      
      // Close the dialog
      setDeletingPet(null);
    } catch (error) {
      // Error already handled in mutation
    }
  };

  if (isPending) {
    return <PetListSkeleton />;
  }

  // Error state
  if (error) {
    const appError = petErrorHandler(error);
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="text-center space-y-2">
              <EmptyStateTitle>Unable to load pets</EmptyStateTitle>
                <MutedText>{appError.message}</MutedText>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!pets || pets.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <EmptyStateTitle>No pets yet</EmptyStateTitle>
                  <EmptyStateDescription className="max-w-md">
                    Add your first pet to start managing...
                  </EmptyStateDescription>
              </div>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Pet
              </Button>
              <ResponsiveDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                title="Add New Pet"
                description="Fill out your pet's information below. Only the name is required."
              >
                <PetForm
                  onSubmit={handleCreatePet}
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

  // Main pet list with tabs
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
          <PageTitle>My Pets</PageTitle>
            <MutedText>
              Manage your {pets?.length} pet{pets.length !== 1 ? 's' : ''}
            </MutedText>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Pet
          </Button>
          <ResponsiveDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            title="Add New Pet"
            description="Fill out your pet's information below. Only the name is required."
          >
            <PetForm
              onSubmit={handleCreatePet}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={isActionLoading}
            />
          </ResponsiveDialog>
        </div>

        {/* Pet Tabs */}
        <Tabs value={activeTab} onValueChange={setUserSelectedTab} className="w-full">
        <TabsList className="flex w-full overflow-x-auto scrollbar-none justify-start">
          {pets?.map((pet) => (
              <TabsTrigger 
                key={pet.id} 
                value={pet.id}
                className="flex items-center gap-2 text-left min-w-[160px]"
              >
              <img
                  src="/single/Pettr-Paw_Solid-black_2026.svg"
                  aria-hidden="true"
                  className="w-4 h-4 opacity-[0.5] pointer-events-none select-none"
                  alt=""
                />   
                <span className="truncate">{pet.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Pet Tab Content */}
          {pets?.map((pet) => (
            <TabsContent key={pet.id} value={pet.id} className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

                {/* Left col — sticky pet card */}
                <div className="lg:sticky lg:top-4">
                  <PetCard
                    pet={pet}
                    onEdit={() => setEditingPet(pet)}
                    onDelete={() => setDeletingPet(pet)}
                  />
                </div>

                {/* Right col — scrollable trackers */}
                <div className="min-w-0 space-y-6">
                  {/* Weight + Food side by side, wrapping on smaller screens */}
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                 
                    <WeightTracker 
                      petId={pet.id} 
                      animalType={pet.animalType} 
                    />
                    <FoodTracker 
                      petId={pet.id}
                    />
                  </div>

                  {/* Notes full width within right col */}
                  <NotesWidget
                    petId={pet.id}
                  />

                  {/* Coming Soon Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">More coming soon...</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        Symptoms tracker, medecine tracker and more coming soon!
                      </p>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Edit Pet Dialog */}
        <ResponsiveDialog
          open={!!editingPet}
          onOpenChange={(open) => {
            if (!open && !isActionLoading) setEditingPet(null);
          }}
          title="Edit Pet"
          description="Update your pet's information below."
        >
          {editingPet && (
            <EditPetForm
              pet={editingPet}
              onSubmit={handleUpdatePet}
              onCancel={() => setEditingPet(null)}
              isLoading={isActionLoading}
            />
          )}
        </ResponsiveDialog>

        {/* Delete Pet Confirmation */}
        <AlertDialog 
          open={!!deletingPet} 
          onOpenChange={(open) => {
            // Only allow closing if not currently loading
            if (!open && !isActionLoading) {
              setDeletingPet(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pet</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deletingPet?.name}? This will also delete all associated data including weight entries, vet records, and other information. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isActionLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeletePet}
                disabled={isActionLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isActionLoading && 
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                }
                Delete Pet
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}