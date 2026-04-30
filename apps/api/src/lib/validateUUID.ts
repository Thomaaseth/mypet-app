import { BadRequestError } from '@/middleware/errors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(id: string, fieldName: string = 'ID'): void {
  if (!id || !UUID_REGEX.test(id)) {
    throw new BadRequestError(`Invalid ${fieldName} format`);
  }
}