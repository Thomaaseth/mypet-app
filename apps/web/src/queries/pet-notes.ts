import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { petNoteApi, petNoteErrorHandler } from "@/lib/api/domains/pet-notes";
import { toast, toastService } from "@/lib/toast";
import type { PetNote, PetNoteFormData } from '@/types/pet-notes';
import { useTranslation } from 'react-i18next';

// QUERY KEYS
export const petNoteKeys = {
    all: ['pet-notes'] as const,
    byPet: (petId: string) => ['pet-notes', petId] as const,
};

// GET
export function usePetNotes(petId: string) {
    return useQuery({
        queryKey: petNoteKeys.byPet(petId),
        queryFn: () => petNoteApi.getNotes(petId),
        enabled: !!petId,
    })
}

// CREATE
export function useCreatePetNote(petId: string) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
  
    return useMutation({
      mutationFn: (data: PetNoteFormData) => petNoteApi.createNote(petId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: petNoteKeys.byPet(petId) });
        toastService.success(t('toasts.notes.addSuccess'));
      },
      onError: (error) => {
        const appError = petNoteErrorHandler(error);
        toastService.error(t('toasts.notes.addError'), appError.message);
      },
    });
}

// UPDATE
export function useUpdatePetNote(petId: string) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({ noteId, data }: { noteId: string, data: PetNoteFormData }) =>
            petNoteApi.updateNote(petId, noteId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: petNoteKeys.byPet(petId) });
            toastService.success(t('toasts.notes.updateSuccess'));
        },
        onError: (error) => {
            const appError = petNoteErrorHandler(error);
            toastService.error(t('toasts.notes.updateError'), appError.message)
        }
    })
}

// DELETE
export function useDeletePetNote(petId: string) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (noteId: string) => petNoteApi.deleteNote(petId, noteId),
        // Optimistic delete: cancel → snapshot → filter → rollback (onError) → invalidate (onSettled)
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
            toastService.success(t('toasts.notes.deleteSuccess'));
        },
        onError: (error, _noteId, context) => {
            // rollback on error
            if (context?.previousNotes) {
                queryClient.setQueryData(petNoteKeys.byPet(petId), context.previousNotes);
            }
            const appError = petNoteErrorHandler(error);
            toastService.error(t('toasts.notes.deleteError'), appError.message)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: petNoteKeys.byPet(petId) })
        }
    })
}
