import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotebookPen, Plus, Trash2, Check, X, AlertCircle, Loader2, Pencil, MoreHorizontal } from 'lucide-react';
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
import { EmptyStateTitle, EmptyStateDescription, BodyText } from '@/components/ui/typography';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { EmptyStateCta } from '@/components/ui/empty-state-cta';

const MAX_CONTENT_LENGTH = 200;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditValue(note.content);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(note.content);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    // No change — skip the API call
    if (trimmed === note.content) {
      setIsEditing(false);
      return;
    }
    if (!trimmed || trimmed.length > MAX_CONTENT_LENGTH) return;

    setIsSaving(true);
    await onUpdate(note.id, trimmed);
    setIsSaving(false);
    setIsEditing(false);
  };


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
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(note)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ResponsiveDialog
        open={isEditing}
        onOpenChange={(open) => { if (!open) handleCancel(); }}
        title="Edit Note"
      >
        <div className="space-y-4">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            maxLength={MAX_CONTENT_LENGTH}
            disabled={isSaving}
            rows={4}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {editValue.length}/{MAX_CONTENT_LENGTH}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !editValue.trim()}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}

export default function NotesWidget({ petId }: NotesWidgetProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<PetNote | null>(null);

  const { data: notes, error: fetchError } = usePetNotes(petId);
  const createMutation = useCreatePetNote(petId);
  const updateMutation = useUpdatePetNote(petId);
  const deleteMutation = useDeletePetNote(petId);

  const isAtLimit = (notes?.length ?? 0) >= MAX_NOTES;

  const handleStartAdd = () => {
    setNewNoteContent('');
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setNewNoteContent('');
    setIsAdding(false);
  };

  const handleCreate = async () => {
    const trimmed = newNoteContent.trim();
    if (!trimmed || trimmed.length > MAX_CONTENT_LENGTH) return;

    setIsCreating(true);
    await createMutation.mutateAsync({ content: trimmed });
    setIsCreating(false);
    setNewNoteContent('');
    setIsAdding(false);
  };

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
            Notes
          </CardTitle>
          {notes && notes.length > 0 && !isAtLimit && (
            <Button
              size="sm"
              onClick={handleStartAdd}
              disabled={isAdding}
              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add note</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load notes. Please try again.</AlertDescription>
          </Alert>
        )}

        {/* Add note dialog */}
        <ResponsiveDialog
          open={isAdding}
          onOpenChange={(open) => { if (!open) handleCancelAdd(); }}
          title="Add Note"
        >
          <div className="space-y-4">
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Type a note..."
              maxLength={MAX_CONTENT_LENGTH}
              disabled={isCreating}
              rows={4}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {newNoteContent.length}/{MAX_CONTENT_LENGTH}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelAdd} disabled={isCreating}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating || !newNoteContent.trim()}>
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />}
                  Add Note
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
              title="No notes yet"
              description="Add things you want to remember about your pet."
              buttonLabel="Add note"
              onAction={handleStartAdd}
            />
          )
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!noteToDelete} onOpenChange={(open) => { if (!open) setNoteToDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this note? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!deletingNoteId}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={!!deletingNoteId}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deletingNoteId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {deletingNoteId ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isAtLimit && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Maximum of {MAX_NOTES} notes reached.
          </p>
        )}
      </CardContent>
    </Card>
  );
}