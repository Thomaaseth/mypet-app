import multer from 'multer';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './supabase';
import { BadRequestError } from '@/middleware/errors';

// Type alias
export type UploadedFile = Express.Multer.File;


export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
        fields: 0,
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ALLOWED_MIME_TYPES[number])) {
            cb(null, true)
        } else {
            cb(new BadRequestError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`)) 
        }
    },
})