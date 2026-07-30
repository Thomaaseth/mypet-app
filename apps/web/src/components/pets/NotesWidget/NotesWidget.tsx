import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotebookPen, Plus, Trash2, AlertCircle, Loader2, Pencil, MoreHorizontal } from 'lucide-react';
import {
  usePetNotes,
  useCreatePetNote,
  useUpdatePetNote,
  useDeletePetNote,
} from '@/queries/pet-notes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { NotesWidgetSkeleton } from '@/components/ui/skeletons/NotesSkeleton';
import type { PetNote } from '@/types/pet-notes';
import { BodyText, ErrorText } from '@/components/ui/typography';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { EmptyStateCta } from '@/components/ui/empty-state-cta';
import { useTranslation } from 'react-i18next';
import type { TranslationKey } from '@/i18n/translation-key';
import { petNoteFormSchema } from '@/lib/validations/pet-notes';
import { usePetNoteForm } from '@/hooks/usePetNoteForm';

const MAX_CONTENT_LENGTH = petNoteFormSchema.shape.content.maxLength ?? 200;
const MAX_NOTES = 20;

interface NotesWidgetProps {
  petId: string;
}

interface NoteRowProps {
  note: PetNote;
  onUpdate: (noteId: string, content: string) => Promise<void>;
  onDelete: (note: PetNote) => void;
  isDeleting: boolean;
}

function NoteRow({ note, onUpdate, onDelete, isDeleting }: NoteRowProps) {
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);

  const {
    register, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = usePetNoteForm({ defaultValues: { content: note.content } });

  const contentValue = watch('content') ?? '';

  const handleStartEdit = () => { reset({ content: note.content }); setIsEditing(true); };
  const handleCancel = () => { reset({ content: note.content }); setIsEditing(false); };

  const onSave = handleSubmit(async (data) => {
    const trimmed = data.content.trim();
    if (!trimmed) return;                                   // schema min(1) passes "   "
    if (trimmed === note.content) { setIsEditing(false); return; } // no change → skip API
    await onUpdate(note.id, trimmed);
    setIsEditing(false);
  });

    return (
      <>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
        <BodyText
          className="flex-1 break-words min-w-0 py-1"
          style={{ fontSize: 'clamp(0.8rem, 3vw, 0.875rem)' }}
        >
          {note.content}
        </BodyText>
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-3.5 w-3.5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleStartEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                {t('common.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(note)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ResponsiveDialog
        open={isEditing}
        onOpenChange={(open) => { if (!open) handleCancel(); }}
        title={t('notes.editDialog.title')}
      >
        <div className="space-y-4">
          <Textarea
            {...register('content')}
            maxLength={MAX_CONTENT_LENGTH}
            disabled={isSubmitting}
            rows={4}
            className="resize-none"
          />
          {errors.content && <ErrorText>{t(errors.content.message as TranslationKey)}</ErrorText>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t('notes.charCount', { count: contentValue.length })}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                {t('common.actions.cancel')}
              </Button>
              <Button onClick={onSave} disabled={isSubmitting || !contentValue.trim()}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('common.actions.save')}
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}

export default function NotesWidget({ petId }: NotesWidgetProps) {
  const { t } = useTranslation();

  const [isAdding, setIsAdding] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<PetNote | null>(null);

  const { data: notes, error: fetchError } = usePetNotes(petId);
  const createMutation = useCreatePetNote(petId);
  const updateMutation = useUpdatePetNote(petId);
  const deleteMutation = useDeletePetNote(petId);

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    watch: watchAdd,
    resetToEmpty,
    formState: { errors: addErrors, isSubmitting: isCreating },
  } = usePetNoteForm();

  const addContentValue = watchAdd('content') ?? '';
  const isAtLimit = (notes?.length ?? 0) >= MAX_NOTES;

  const handleStartAdd = () => {
    resetToEmpty();
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    resetToEmpty();
    setIsAdding(false);
  };

  const handleCreate = handleSubmitAdd(async (data) => {
    const trimmed = data.content.trim();
    if (!trimmed) return;
    await createMutation.mutateAsync({ content: trimmed });
    resetToEmpty();
    setIsAdding(false);
  });

  const handleUpdate = async (noteId: string, content: string) => {
    await updateMutation.mutateAsync({ noteId, data: { content } });
  };

  const handleRequestDelete = (note: PetNote) => {
    setNoteToDelete(note);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    const noteId = noteToDelete.id;
    setNoteToDelete(null);
    setDeletingNoteId(noteId);
    await deleteMutation.mutateAsync(noteId);
    setDeletingNoteId(null);
  };

  if (notes === undefined) return <NotesWidgetSkeleton />;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5" />
            {t('notes.widget.title')}
          </CardTitle>
          {notes && notes.length > 0 && !isAtLimit && (
            <Button
              size="sm"
              onClick={handleStartAdd}
              disabled={isAdding}
              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('notes.widget.addNote')}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('notes.widget.loadError')}</AlertDescription>
          </Alert>
        )}

        {/* Add note dialog */}
        <ResponsiveDialog
          open={isAdding}
          onOpenChange={(open) => { if (!open) handleCancelAdd(); }}
          title={t('notes.addDialog.title')}
        >
          <div className="space-y-4">
            <Textarea
              {...registerAdd('content')}
              placeholder={t('notes.addDialog.placeholder')}
              maxLength={MAX_CONTENT_LENGTH}
              disabled={isCreating}
              rows={4}
              className="resize-none"
            />
            {addErrors.content && (
              <ErrorText>{t(addErrors.content.message as TranslationKey)}</ErrorText>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('notes.charCount', { count: addContentValue.length })}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelAdd} disabled={isCreating}>
                  {t('common.actions.cancel')}
                </Button>
                <Button onClick={handleCreate} disabled={isCreating || !addContentValue.trim()}>
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />}
                  {t('notes.addDialog.submit')}
                </Button>
              </div>
            </div>
          </div>
        </ResponsiveDialog>

        {/* Notes list */}
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              onUpdate={handleUpdate}
              onDelete={handleRequestDelete}
              isDeleting={deletingNoteId === note.id}
            />
          ))
        ) : (
          !isAdding && (
            <EmptyStateCta
              icon={NotebookPen}
              title={t('notes.widget.emptyTitle')}
              description={t('notes.widget.emptyDescription')}
              buttonLabel={t('notes.widget.addNote')}
              onAction={handleStartAdd}
            />
          )
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!noteToDelete} onOpenChange={(open) => { if (!open) setNoteToDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('notes.deleteDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('notes.deleteDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!deletingNoteId}>{t('common.actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={!!deletingNoteId}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deletingNoteId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {deletingNoteId ? t('notes.deleteDialog.deleting') : t('common.actions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isAtLimit && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            {t('notes.widget.limitReached', { count: MAX_NOTES })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}