import { useRef, useState, useCallback } from 'react';
import { Camera, Trash2, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUploadPetImage, useDeletePetImage } from '@/queries/pets';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/constants/upload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import EasyCrop, { type Area } from 'react-easy-crop';
import { isModuleNamespaceObject } from 'util/types';
import { fi } from 'zod/v4/locales';
import { cp } from 'fs';

// Canva utility
async function getCroppedImageAsFile(imageSrc: string, croppedAreaPixels: Area, fileName: string): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas to blob failed'));
        return;
      }
      // Output in WebP
      resolve(new File([blob], `${fileName}.webp`, { type: 'image/webp'}))
    },
    'image/webp',
    0.92, // 92% quality
    );
  });
}

// Component

interface PetImageUploadProps {
  petId: string;
  petName: string;
  signedUrl: string | null;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export function PetImageUpload({ petId, petName, signedUrl }: PetImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // validation error
  const [clientError, setClientError] = useState<string | null>(null);

  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const uploadMutation = useUploadPetImage(petId);
  const deleteMutation = useDeletePetImage(petId);

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  // Called by react easy crop when the crop area changes
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so selecting the same file again triggers onChange
    e.target.value = '';

    if (!file) return;

    setClientError(null);

    // Client-side validation MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      setClientError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
      setClientError(`File is too large. Maximum size is ${maxMB}MB.`);
      return;
    }

    // create object url for the cropper and open dialog
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropDialogOpen(true);
  }

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsCropping(true);
    try {
      const croppedFile = await getCroppedImageAsFile(
        imageSrc,
        croppedAreaPixels,
        petName.toLocaleLowerCase().replace(/\s+/g, '-'),
      );

      // clean up object url
      URL.revokeObjectURL(imageSrc);
      setImageSrc(null);
      setCropDialogOpen(false);
    
      uploadMutation.mutate(croppedFile);
  } catch {
    setClientError('Failed to process image, please try again.');
  } finally {
    setIsCropping(false)
  }
};

  const handleCropCancel = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    setCropDialogOpen(false);
  }

  const handleRemove = () => {
    setClientError(null);
    deleteMutation.mutate();
  };

  return (
    <>
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

        {/* Remove button */}
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

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => !open && handleCropCancel()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop photo</DialogTitle>
          </DialogHeader>

          {/* Cropper area */}
          <div className="relative w-full h-72 rounded-md overflow-hidden bg-black">
            {imageSrc && (
              <EasyCrop
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // Square crop — consistent with avatar/card display
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 px-1">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCropCancel}
              disabled={isCropping}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              disabled={isCropping}
            >
              {isCropping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCropping ? 'Processing...' : 'Use photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}