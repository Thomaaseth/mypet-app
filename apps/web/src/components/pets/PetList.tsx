import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Heart, Loader2 } from 'lucide-react';
import { usePets, useCreatePet, useUpdatePet, useDeletePet } from '@/queries/pets';
import PetCard from './PetCard';
import PetForm from './PetForm';
import type { Pet, PetFormData } from '@/types/pet';
import { petErrorHandler } from '@/lib/api/pets';
import { PetListSkeleton } from '@/components/ui/skeletons/PetSkeleton';
import { WeightTracker } from './WeightTracker';
import { FoodTracker } from './FoodTracker';

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
  const [activeTab, setActiveTab] = useState<string>('');

// NEEDS TO CHANGE LOGIC TO REORG PET TABS, FOR NOW: 

// Set active tab to first pet when pets load
//   useState(() => {
//     if (pets.length > 0 && !activeTab) {
//       setActiveTab(pets[0].id);
//     }
//   });
    useEffect(() => {
    if (pets && pets.length > 0 && !activeTab) {
        setActiveTab(pets[0].id); // Auto-select first pet (latest added => desc order)
    }
    }, [pets, activeTab]);

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
    if (!deletingPet) return;
    
    try {
      await deletePetMutation.mutateAsync(deletingPet.id);
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
              <h3 className="text-lg font-semibold">Unable to load pets</h3>
              <p className="text-muted-foreground">{appError.message}</p>
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
                <h3 className="text-xl font-semibold">No pets yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Add your first pet to start managing their information, tracking their health, and keeping all their details in one place.
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Pet
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Pet</DialogTitle>
                    <DialogDescription>
                      Fill out your pet&apos;s information below. Only the name is required.
                    </DialogDescription>
                  </DialogHeader>
                  <PetForm
                    onSubmit={handleCreatePet}
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

  // Main pet list with tabs
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Pets</h1>
            <p className="text-muted-foreground">
              Manage your {pets?.length} pet{pets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Pet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Pet</DialogTitle>
                <DialogDescription>
                  Fill out your pet&apos;s information below. Only the name is required.
                </DialogDescription>
              </DialogHeader>
              <PetForm
                onSubmit={handleCreatePet}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={isActionLoading}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Pet Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center w-full">
            {pets?.map((pet) => (
              <TabsTrigger 
                key={pet.id} 
                value={pet.id}
                className="flex items-center gap-2 text-left min-w-[120px]"
              >
                <Heart className="h-4 w-4" />
                <span className="truncate">{pet.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Pet Tab Content */}
          {pets?.map((pet) => (
            <TabsContent key={pet.id} value={pet.id} className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                    <PetCard
                        pet={pet}
                        onEdit={() => setEditingPet(pet)}
                        onDelete={() => setDeletingPet(pet)}
                    />
                    </div>

                    {/* Quick Stats */}
                    <div>
                    <Card>
                        <CardHeader>
                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                            <span className="text-muted-foreground">Species:</span>
                            <span>{pet.species || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                            <span className="text-muted-foreground">Gender:</span>
                            <span className="capitalize">{pet.gender}</span>
                            </div>
                            {pet.weight && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Weight:</span>
                                <span>{pet.weight} {pet.weightUnit}</span>
                            </div>
                            )}
                            <div className="flex justify-between">
                            <span className="text-muted-foreground">Spayed/Neutered:</span>
                            <span>{pet.isNeutered ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                    </div>
                </div>

                {/* Weight Tracker Section - Full Width */}
                <WeightTracker 
                    petId={pet.id} 
                    weightUnit={pet.weightUnit} 
                />

                {/* Food Tracker Section - Full Width */}
                <FoodTracker 
                    petId={pet.id}
                />

                {/* Coming Soon Card */}
                <Card>
                    <CardHeader>
                    <CardTitle className="text-lg">Coming Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p className="text-muted-foreground text-sm">
                        Food management and vet records will be available here soon!
                    </p>
                    </CardContent>
                </Card>
                </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Edit Pet Dialog */}
        <Dialog open={!!editingPet} onOpenChange={() => setEditingPet(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Pet</DialogTitle>
              <DialogDescription>
                Update your pet&apos;s information below.
              </DialogDescription>
            </DialogHeader>
            {editingPet && (
              <PetForm
                pet={editingPet}
                onSubmit={handleUpdatePet}
                onCancel={() => setEditingPet(null)}
                isLoading={isActionLoading}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Pet Confirmation */}
        <AlertDialog open={!!deletingPet} onOpenChange={() => setDeletingPet(null)}>
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
                {(createPetMutation.isPending || updatePetMutation.isPending || deletePetMutation.isPending) && 
                  <Loader2 className="h-4 w-4 animate-spin" />
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