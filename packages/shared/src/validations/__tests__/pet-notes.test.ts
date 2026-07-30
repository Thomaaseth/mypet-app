import { describe, it, expect } from 'vitest';
import { petNoteFormSchema } from '../pet-notes';
import { expectRejectsUnknownKey } from './_helpers';

describe('petNoteFormSchema', () => {
  it('accepts a well-formed note', () => {
    expect(petNoteFormSchema.safeParse({ content: 'Vaccination due next month' }).success).toBe(true);
  });
  it('rejects empty content', () => {
    expect(petNoteFormSchema.safeParse({ content: '' }).success).toBe(false);
  });
  it('rejects content over 200 characters', () => {
    expect(petNoteFormSchema.safeParse({ content: 'x'.repeat(201) }).success).toBe(false);
  });
  it('rejects unknown keys (strict)', () => expectRejectsUnknownKey(petNoteFormSchema, { content: 'A note' }));
});