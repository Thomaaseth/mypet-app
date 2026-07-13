import { describe, it, expect, beforeEach, vi } from 'vitest';
import sharp from 'sharp';
import { BadRequestError } from '../../middleware/errors';
import { STORAGE_BUCKET, STORAGE_OUTPUT_MIME_TYPE, MAX_FILE_SIZE_BYTES } from '../../lib/supabase';
import { StorageService } from '../storage.service';

interface MockStorageError {
  message: string;
}

interface MockUploadResult {
  data: { path: string } | null;
  error: MockStorageError | null;
}

interface MockSignedUrlResult {
  data: { signedUrl: string } | null;
  error: MockStorageError | null;
}

interface MockRemoveResult {
  data: unknown;
  error: MockStorageError | null;
}

// Mock fns are hoisted so they can be referenced both inside vi.mock's
// factory (which itself is hoisted above imports by vitest) and in tests.
const { mockUpload, mockCreateSignedUrl, mockRemove, mockFrom } = vi.hoisted(() => {
  const mockUpload = vi.fn<
    (path: string, body: Buffer, opts: { contentType: string; upsert: boolean }) => Promise<MockUploadResult>
  >();
  const mockCreateSignedUrl = vi.fn<
    (path: string, expiresIn: number) => Promise<MockSignedUrlResult>
  >();
  const mockRemove = vi.fn<(paths: string[]) => Promise<MockRemoveResult>>();
  const mockFrom = vi.fn(() => ({
    upload: mockUpload,
    createSignedUrl: mockCreateSignedUrl,
    remove: mockRemove,
  }));
  return { mockUpload, mockCreateSignedUrl, mockRemove, mockFrom };
});

// Only the `supabase` client is mocked — constants (ALLOWED_MIME_TYPES,
// STORAGE_BUCKET, etc.) come from the real module so tests stay in sync
// with the actual config instead of a duplicated copy.
vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/supabase')>();
  return {
    ...actual,
    supabase: {
      storage: {
        from: mockFrom,
      },
    },
  };
});

const TEST_USER_ID = 'user-123';
const TEST_PET_ID = 'pet-456';

// Tiny real, valid images per format — generated via sharp itself rather
// than hand-written byte arrays, so the fixtures are guaranteed to be
// genuinely decodable (and so magic-byte checks are exercised against
// real headers, not a guess at what they look like).
async function makeValidImage(format: 'png' | 'jpeg' | 'webp'): Promise<Buffer> {
  const image = sharp({
    create: { width: 4, height: 4, channels: 3, background: { r: 100, g: 150, b: 200 } },
  });
  if (format === 'png') return image.png().toBuffer();
  if (format === 'jpeg') return image.jpeg().toBuffer();
  return image.webp().toBuffer();
}

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue({ data: { path: 'mock-path' }, error: null });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://mock-signed-url.test/image.webp' },
      error: null,
    });
    mockRemove.mockResolvedValue({ data: null, error: null });
  });

  describe('uploadedPetImage', () => {
    it('rejects a mime type outside the allowed list before inspecting content', async () => {
      const buffer = await makeValidImage('png');

      await expect(
        StorageService.uploadedPetImage(buffer, 'image/gif', TEST_PET_ID, TEST_USER_ID)
      ).rejects.toThrow(BadRequestError);

      // Should fail on the type check, never reach the upload call
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('rejects a file larger than the configured size limit', async () => {
      const oversized = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1);

      await expect(
        StorageService.uploadedPetImage(oversized, 'image/png', TEST_PET_ID, TEST_USER_ID)
      ).rejects.toThrow(BadRequestError);

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('rejects a buffer too short to contain a valid signature', async () => {
      const tooShort = Buffer.from([0x89, 0x50, 0x4e]);

      await expect(
        StorageService.uploadedPetImage(tooShort, 'image/png', TEST_PET_ID, TEST_USER_ID)
      ).rejects.toThrow(BadRequestError);
    });

    it('rejects content whose real bytes do not match the declared mime type', async () => {
      const jpegBytes = await makeValidImage('jpeg');

      // Declared as PNG, but the bytes are genuinely JPEG — magic-byte
      // check should catch the mismatch regardless of the label.
      await expect(
        StorageService.uploadedPetImage(jpegBytes, 'image/png', TEST_PET_ID, TEST_USER_ID)
      ).rejects.toThrow(BadRequestError);

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it.each(['png', 'jpeg', 'webp'] as const)(
      'accepts a valid %s input, converts it to webp, and uploads it',
      async (format) => {
        const buffer = await makeValidImage(format);
        const mimeType = `image/${format}`;

        const result = await StorageService.uploadedPetImage(
          buffer,
          mimeType,
          TEST_PET_ID,
          TEST_USER_ID
        );

        expect(result).toEqual({
          path: `${TEST_USER_ID}/${TEST_PET_ID}.webp`,
          signedUrl: 'https://mock-signed-url.test/image.webp',
        });

        expect(mockFrom).toHaveBeenCalledWith(STORAGE_BUCKET);
        expect(mockUpload).toHaveBeenCalledTimes(1);

        const [uploadedPath, uploadedBuffer, uploadOpts] = mockUpload.mock.calls[0];
        expect(uploadedPath).toBe(`${TEST_USER_ID}/${TEST_PET_ID}.webp`);
        expect(uploadOpts).toEqual({ contentType: STORAGE_OUTPUT_MIME_TYPE, upsert: true });

        // The buffer actually handed to Supabase should be real, valid webp —
        // verifies the sharp conversion ran, rather than just trusting a mock.
        const uploadedMetadata = await sharp(uploadedBuffer).metadata();
        expect(uploadedMetadata.format).toBe('webp');
      }
    );

    it('throws when the Supabase upload call returns an error', async () => {
      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'network error' },
      });
      const buffer = await makeValidImage('png');

      await expect(
        StorageService.uploadedPetImage(buffer, 'image/png', TEST_PET_ID, TEST_USER_ID)
      ).rejects.toThrow(BadRequestError);
    });

    it('throws a BadRequestError (not a raw sharp error) when the image cannot be decoded', async () => {
      // Valid PNG signature (passes the magic-byte check) followed by
      // garbage — sharp should fail to decode this during conversion.
      const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const corrupted = Buffer.concat([pngSignature, Buffer.from('not a real png body')]);

      await expect(
        StorageService.uploadedPetImage(corrupted, 'image/png', TEST_PET_ID, TEST_USER_ID)
      ).rejects.toThrow(BadRequestError);

      expect(mockUpload).not.toHaveBeenCalled();
    });
  });

  describe('getSignedUrl', () => {
    it('returns the signed url on success', async () => {
      const url = await StorageService.getSignedUrl('some/path.webp');
      expect(url).toBe('https://mock-signed-url.test/image.webp');
    });

    it('throws a BadRequestError when Supabase returns an error', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'not found' },
      });

      await expect(StorageService.getSignedUrl('some/path.webp')).rejects.toThrow(BadRequestError);
    });

    it('throws a BadRequestError when no signedUrl is returned despite no error', async () => {
      mockCreateSignedUrl.mockResolvedValue({ data: null, error: null });

      await expect(StorageService.getSignedUrl('some/path.webp')).rejects.toThrow(BadRequestError);
    });
  });

  describe('deletePetImage', () => {
    it('resolves without throwing on success', async () => {
      await expect(StorageService.deletePetImage('some/path.webp')).resolves.toBeUndefined();
      expect(mockRemove).toHaveBeenCalledWith(['some/path.webp']);
    });

    it('does not throw even if Supabase returns an error (logs and swallows it)', async () => {
      mockRemove.mockResolvedValue({ data: null, error: { message: 'not found' } });

      await expect(StorageService.deletePetImage('some/path.webp')).resolves.toBeUndefined();
    });
  });
});