'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotebookPen, Plus, Trash2, Check, X, AlertCircle, Loader2, Pencil } from 'lucide-react';
import {
  usePetNotes,
  useCreatePetNote,
  useUpdatePetNote,
  useDeletePetNote,
} from '@/queries/pet-notes';
import { NotesWidgetSkeleton } from '@/components/ui/skeletons/NotesSkeleton';
import type { PetNote } from '@/types/pet-notes';

const MAX_CONTENT_LENGTH = 200;
const MAX_NOTES = 20;

interface NotesWidgetProps {
  petId: string;
}

interface NoteRowProps {
  note: PetNote;
  onUpdate: (noteId: string, content: string) => Promise<void>;
  onDelete: (noteId: string) => void;
  isDeleting: boolean;
}

function NoteRow({ note, onUpdate, onDelete, isDeleting }: NoteRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      const length = inputRef.current.value.length;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_CONTENT_LENGTH}
          disabled={isSaving}
          className="h-8 text-sm flex-1"
        />
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {editValue.length}/{MAX_CONTENT_LENGTH}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 flex-shrink-0 text-green-600 hover:text-green-700"
          onClick={handleSave}
          disabled={isSaving || !editValue.trim()}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 flex-shrink-0"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
      <p className="text-sm flex-1 break-words min-w-0 py-1">
        {note.content}
      </p>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleStartEdit}
          disabled={isDeleting}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 hover:text-destructive"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function NotesWidget({ petId }: NotesWidgetProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const { data: notes, isPending, error: fetchError } = usePetNotes(petId);
  const createMutation = useCreatePetNote(petId);
  const updateMutation = useUpdatePetNote(petId);
  const deleteMutation = useDeletePetNote(petId);

  const isAtLimit = (notes?.length ?? 0) >= MAX_NOTES;

  // Focus the add input when it appears
  useEffect(() => {
    if (isAdding) {
      addInputRef.current?.focus();
    }
  }, [isAdding]);

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

    await createMutation.mutateAsync({ content: trimmed });
    setNewNoteContent('');
    setIsAdding(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') handleCancelAdd();
  };

  const handleUpdate = async (noteId: string, content: string) => {
    await updateMutation.mutateAsync({ noteId, data: { content } });
  };

  const handleDelete = async (noteId: string) => {
    setDeletingNoteId(noteId);
    await deleteMutation.mutateAsync(noteId);
    setDeletingNoteId(null);
  };

  if (isPending) return <NotesWidgetSkeleton />;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <NotebookPen className="h-5 w-5" />
            Notes
          </CardTitle>
          {!isAtLimit && (
            <Button
              onClick={handleStartAdd}
              disabled={isAdding}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add note
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Fetch error */}
        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load notes. Please try again.</AlertDescription>
          </Alert>
        )}

        {/* Add new note input */}
        {isAdding && (
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
            <Input
              ref={addInputRef}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Type a note..."
              maxLength={MAX_CONTENT_LENGTH}
              disabled={createMutation.isPending}
              className="h-8 text-sm flex-1"
            />
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {newNoteContent.length}/{MAX_CONTENT_LENGTH}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0 text-green-600 hover:text-green-700"
              onClick={handleCreate}
              disabled={createMutation.isPending || !newNoteContent.trim()}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0"
              onClick={handleCancelAdd}
              disabled={createMutation.isPending}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Notes list */}
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isDeleting={deletingNoteId === note.id}
            />
          ))
        ) : (
            !isAdding && (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <NotebookPen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold mb-1">No notes yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add things you want to remember about your pet.
                  </p>
                  <Button onClick={handleStartAdd} disabled={isAdding}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add note
                  </Button>
            </div>
          )
        )}

        {/* At limit warning */}
        {isAtLimit && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Maximum of {MAX_NOTES} notes reached.
          </p>
        )}
      </CardContent>
    </Card>
  );
}