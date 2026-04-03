import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { petNoteApi, petNoteErrorHandler } from "@/lib/api/domains/pet-notes";
import { toast, toastService } from "@/lib/toast";
import type { PetNote, PetNoteFormData } from '@/types/pet-notes';
import { string } from "zod";

// QUERY KEYS
export const petNoteKeys = {
    all: ['pet-notes'] as const,
    byPet: (petId: string) => ['pet-notes', petId] as const,
};

// GET
export function usePetNotes(petId: string) {
    return useQuery({
        queryKey: petNoteKeys.byPet(petId),
        queryFn: async () => {
            const response = await petNoteApi.getNotes(petId);
            return response.notes;
        },
        enabled: !!petId,
    })
}

// CREATE
export function useCreatePetNote(petId: string) {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (data: PetNoteFormData) => petNoteApi.createNote(petId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: petNoteKeys.byPet(petId) });
        toastService.success('Note added');
      },
      onError: (error) => {
        const appError = petNoteErrorHandler(error);
        toastService.error('Failed to add note', appError.message);
      },
    });
}

// UPDATE
export function useUpdatePetNote(petId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ noteId, data }: { noteId: string, data: PetNoteFormData }) =>
            petNoteApi.updateNote(petId, noteId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: petNoteKeys.byPet(petId) });
            toastService.success('Note updated');
        },
        onError: (error) => {
            const appError = petNoteErrorHandler(error);
            toastService.error('Failed to updated note', appError.message)
        }
    })
}

// DELETE
export function useDeletePetNote(petId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (noteId: string) => petNoteApi.deleteNote(petId, noteId),
        onMutate: async (noteId) => {
            // cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: petNoteKeys.byPet(petId) });

            // snapshot previous value
            const previousNotes = queryClient.getQueryData<PetNote[]>(
              petNoteKeys.byPet(petId)
            );
      
            // optimistic delete
            queryClient.setQueryData<PetNote[]>(
              petNoteKeys.byPet(petId),
              (old) => old?.filter((note) => note.id !== noteId)
            );
      
            return { previousNotes };
        },
        onSuccess: () => {
            toastService.success('Note deleted');
        },
        onError: (error, _noteId, context) => {
            // rollback on error
            if (context?.previousNotes) {
                queryClient.setQueryData(petNoteKeys.byPet(petId), context.previousNotes);
            }
            const appError = petNoteErrorHandler(error);
            toastService.error('Failed to delete note', appError.message)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: petNoteKeys.byPet(petId) })
        }
    })
}
