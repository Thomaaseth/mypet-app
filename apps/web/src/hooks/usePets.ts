// import { useState, useEffect, useCallback } from 'react';
// import { petApi, petErrorHandler } from '@/lib/api/pets';
// import { useErrorState } from '@/hooks/useErrorsState';
// import type { Pet, PetFormData } from '@/types/pet';
// import { toastService } from '@/lib/toast';

// interface UsePetsState {
//   pets: Pet[];
//   isLoading: boolean;
//   error: string | null;
// }

// interface UsePetsReturn extends UsePetsState {
//   refreshPets: () => Promise<void>;
//   createPet: (petData: PetFormData) => Promise<Pet | null>;
//   updatePet: (petId: string, petData: Partial<PetFormData>) => Promise<Pet | null>;
//   deletePet: (petId: string) => Promise<boolean>;
//   getPetById: (petId: string) => Pet | undefined;
// }

// export function usePets(): UsePetsReturn {
//   const [state, setState] = useState<UsePetsState>({
//     pets: [],
//     isLoading: true,
//     error: null,
//   });

//   const { executeAction } = useErrorState();

//   // Load all pets
//   const loadPets = useCallback(async () => {
//     setState(prev => ({ ...prev, isLoading: true, error: null }));

//     try {
//       const response = await petApi.getPets();
//       setState({
//         pets: response.pets,
//         isLoading: false,
//         error: null,
//       });
//     } catch (error) {
//       const petError = petErrorHandler(error);
//       setState({
//         pets: [],
//         isLoading: false,
//         error: petError.message,
//       });
//     }
//   }, []);

//   // Public refresh function
//   const refreshPets = useCallback(async () => {
//     await loadPets();
//   }, [loadPets]);

//   // Create a new pet
//   const createPet = useCallback(async (petData: PetFormData): Promise<Pet | null> => {
//     const result = await executeAction(
//       async () => {

//         const transformedData = {
//         ...petData,
//         weight: petData.weight ? petData.weight.replace(',', '.') : ''
//         };

//         const newPet = await petApi.createPet(transformedData);
        
//         // Update local state by adding the new pet
//         setState(prev => ({
//           ...prev,
//           pets: [newPet, ...prev.pets], // Add to beginning for newest first
//         }));

//         toastService.success('Pet created', `${newPet.name} has been added to your pets!`);
//         return newPet;
//       },
//       petErrorHandler
//     );

//     return result;
//   }, [executeAction]);

//   // Update an existing pet
//   const updatePet = useCallback(async (
//     petId: string, 
//     petData: Partial<PetFormData>
//   ): Promise<Pet | null> => {
//     const result = await executeAction(
//       async () => {

//         const transformedData = {
//         ...petData,
//         weight: petData.weight ? petData.weight.replace(',', '.') : ''
//         };

//         const updatedPet = await petApi.updatePet(petId, transformedData);
        
//         // Update local state
//         setState(prev => ({
//           ...prev,
//           pets: prev.pets.map(pet => 
//             pet.id === petId ? updatedPet : pet
//           ),
//         }));

//         toastService.success('Pet updated', `${updatedPet.name}'s information has been updated!`);
//         return updatedPet;
//       },
//       petErrorHandler
//     );

//     return result;
//   }, [executeAction]);

//   // Delete a pet (soft delete)
//   const deletePet = useCallback(async (petId: string): Promise<boolean> => {
//     const petToDelete = state.pets.find(p => p.id === petId);
//     const petName = petToDelete?.name || 'Pet';

//     const result = await executeAction(
//       async () => {
//         await petApi.deletePet(petId);
        
//         // Update local state by removing the pet
//         setState(prev => ({
//           ...prev,
//           pets: prev.pets.filter(pet => pet.id !== petId),
//         }));

//         toastService.success('Pet deleted', `${petName} has been removed from your pets.`);
//         return true;
//       },
//       petErrorHandler
//     );

//     return result || false;
//   }, [executeAction, state.pets]);

//   // Get a specific pet by ID
//   const getPetById = useCallback((petId: string): Pet | undefined => {
//     return state.pets.find(pet => pet.id === petId);
//   }, [state.pets]);

//   // Load pets on mount
//   useEffect(() => {
//     loadPets();
//   }, [loadPets]);

//   return {
//     ...state,
//     refreshPets,
//     createPet,
//     updatePet,
//     deletePet,
//     getPetById,
//   };
// }