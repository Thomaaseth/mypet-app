import { 
    supabase, 
    storageLogger, 
    STORAGE_BUCKET, 
    ALLOWED_MIME_TYPES, 
    MAX_FILE_SIZE_BYTES, 
    STORAGE_OUTPUT_MIME_TYPE,
    type AllowedMimeType,
 } from "@/lib/supabase";
 import { BadRequestError } from "@/middleware/errors";
 import sharp from "sharp";

 // Signed url expiry 1h
 const SIGNED_URL_EXPIRY_IN_SECONDS = 60 * 60;

 // Sanity check ceiling on decoded pixel count (width * height)
 // 40 megapixels covers modern phone cameras
 const MAX_INPUT_PIXELS = 40_000_000;

 export interface UploadedImage {
    path: string; // storage path in db as imageUrl
    signedUrl: string, // short lived display url returned to client
 }

 export class StorageService {
    // Validates and upload image and returns storage path + signed url
    // Path is {userId}/{petId}.{ext} - use upsert to replace existing image

    private static validateMagicBytes(file: Buffer, mimeType: AllowedMimeType): void {
        const isPNG =
            file[0] === 0x89 &&
            file[1] === 0x50 && // P
            file[2] === 0x4e && // N
            file[3] === 0x47;   // G

        const isJPEG =
            file[0] === 0xff &&
            file[1] === 0xd8 &&
            file[2] === 0xff;

        const isRIFF =
            file[0] === 0x52 && // R
            file[1] === 0x49 && // I
            file[2] === 0x46 && // F
            file[3] === 0x46;   // F

        const isWEBP =
            isRIFF &&
            file[8]  === 0x57 && // W
            file[9]  === 0x45 && // E
            file[10] === 0x42 && // B
            file[11] === 0x50;   // P

        const matchesDeclaredType =
            (mimeType === 'image/png' && isPNG) ||
            (mimeType === 'image/jpeg' && isJPEG) ||
            (mimeType === 'image/webp' && isWEBP);

        if (!matchesDeclaredType) {
            throw new BadRequestError('Invalid file content. File does not match its declared type.');
        }
    }

    // Converts a validated image buffer to WEBP
    private static async convertToWebp(file: Buffer): Promise<Buffer> {
        try {
            return await sharp(file, { limitInputPixels: MAX_INPUT_PIXELS })
                .webp({ quality: 90 })
                .toBuffer();
        } catch (error) {
            storageLogger.error({ err: error }, 'Failed to convert image to WebP');
            throw new BadRequestError('Could not process this image. Please try a different file.');
        }
    }

    static async uploadedPetImage(
        file: Buffer, 
        mimeType: string,
        petId: string,
        userId: string,
    ): Promise<UploadedImage> {
        // Validate mime type
        if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
            throw new BadRequestError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
        }
        const declaredMimeType = mimeType as AllowedMimeType;

        // Validate size
        if (file.byteLength > MAX_FILE_SIZE_BYTES) {
            const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
            throw new BadRequestError(`File size exceeds the ${maxMB}MB limit`);
        }

        // Validate Magic bytes
        if (file.byteLength < 12) {
            throw new BadRequestError('Invalid file content. File does not match its declared type.');
        }
        StorageService.validateMagicBytes(file, declaredMimeType);

        // Normalize to WEBP before persisting
        const webpBuffer = await StorageService.convertToWebp(file);

        const storagePath = `${userId}/${petId}.webp`;

        storageLogger.info(
            { petId, userId, originalMimeType: mimeType, bytes: webpBuffer.byteLength },
            'Uploading image',
        );

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, webpBuffer, {
                contentType: STORAGE_OUTPUT_MIME_TYPE,
                upsert: true,
            });

            if (uploadError) {
                storageLogger.error({ err: uploadError, petId }, 'Failed to upload image');
                throw new BadRequestError('Failed to upload image, please try again.');
            }

            const signedUrl = await StorageService.getSignedUrl(storagePath);

            storageLogger.info({ petId, storagePath }, 'Pet image upload successfully');
            
            return { path: storagePath, signedUrl };
    }

    static async deletePetImage(storagePath: string): Promise<void> {
        storageLogger.info({ storagePath }, 'Deleting image');

        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([storagePath]);

        if (error) {
            storageLogger.error({ err: error, storagePath }, 'Failed to delete image.');
        }
    }

    // generate short lived signed url to use whenever client needs to display image
    static async getSignedUrl(storagePath: string): Promise<string> {
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_IN_SECONDS);

            if (error || !data?.signedUrl) {
                storageLogger.error({ err: error, storagePath }, 'Failed to generate signed url');
                throw new BadRequestError('Failed to generate image url');
            }

            return data.signedUrl;
    }
}