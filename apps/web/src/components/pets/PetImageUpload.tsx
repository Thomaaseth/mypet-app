import { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUploadPetImage, useDeletePetImage } from '@/queries/pets';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/constants/upload';

interface PetImageUploadProps {
  petId: string;
  petName: string;
  signedUrl: string | null;
}

export function PetImageUpload({ petId, petName, signedUrl }: PetImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const uploadMutation = useUploadPetImage(petId);
  const deleteMutation = useDeletePetImage(petId);

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so selecting the same file again triggers onChange
    e.target.value = '';

    if (!file) return;

    setClientError(null);

    // Client-side validation — fast feedback before hitting the API
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      setClientError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
      setClientError(`File is too large. Maximum size is ${maxMB}MB.`);
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleRemove = () => {
    setClientError(null);
    deleteMutation.mutate();
  };

  return (
    <div className="space-y-3">
      {/* Image area — clickable to trigger upload */}
      <div
        className="relative w-full h-48 rounded-lg overflow-hidden bg-muted cursor-pointer group"
        onClick={() => !isLoading && fileInputRef.current?.click()}
        role="button"
        aria-label={signedUrl ? `Change photo of ${petName}` : `Upload photo of ${petName}`}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : signedUrl ? (
          <>
            <img
              src={signedUrl}
              alt={`Photo of ${petName}`}
              className="w-full h-full object-cover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-center">
                <Camera className="h-6 w-6 mx-auto mb-1" />
                <p className="text-sm font-medium">Change photo</p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 group-hover:bg-muted/80 transition-colors">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">Upload photo</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · Max 5MB</p>
          </div>
        )}
      </div>

      {/* Remove button — only shown when photo exists and not loading */}
      {signedUrl && !isLoading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-destructive hover:text-destructive"
          onClick={handleRemove}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove photo
        </Button>
      )}

      {/* Client-side validation error */}
      {clientError && (
        <Alert variant="destructive">
          <AlertDescription>{clientError}</AlertDescription>
        </Alert>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        className="hidden"
        onChange={handleFileSelect}
        disabled={isLoading}
      />
    </div>
  );
}