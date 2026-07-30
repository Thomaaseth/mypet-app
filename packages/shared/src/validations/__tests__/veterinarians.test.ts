import { describe, it, expect } from 'vitest';
import { baseVeterinarianFormSchema, createVeterinarianSchema, updateVeterinarianSchema, petAssignmentSchema } from '../veterinarians';
import { expectRejectsUnknownKey } from './_helpers';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const validVet = { vetName: 'Dr. Jane Smith', phone: '555-123-4567', addressLine1: '123 Main St', city: 'Springfield', zipCode: '12345' };

describe('baseVeterinarianFormSchema', () => {
  it('accepts a well-formed vet (required fields only)', () => {
    expect(baseVeterinarianFormSchema.safeParse(validVet).success).toBe(true);
  });
  it('rejects unknown keys (strict)', () => expectRejectsUnknownKey(baseVeterinarianFormSchema, validVet));
});

describe('createVeterinarianSchema', () => {
  it('is the same schema as the base (alias, inherits strict)', () => {
    expect(createVeterinarianSchema).toBe(baseVeterinarianFormSchema);
  });
});

describe('updateVeterinarianSchema', () => {
  it('accepts a well-formed update', () => {
    expect(updateVeterinarianSchema.safeParse({ ...validVet, id: VALID_UUID }).success).toBe(true);
  });
  it('requires a valid uuid id', () => {
    expect(updateVeterinarianSchema.safeParse(validVet).success).toBe(false);
  });
  it('rejects unknown keys (strict)', () => expectRejectsUnknownKey(updateVeterinarianSchema, { ...validVet, id: VALID_UUID }));
});

describe('petAssignmentSchema', () => {
  it('accepts at least one petId', () => {
    expect(petAssignmentSchema.safeParse({ petIds: [VALID_UUID] }).success).toBe(true);
  });
  it('rejects an empty petIds array', () => {
    expect(petAssignmentSchema.safeParse({ petIds: [] }).success).toBe(false);
  });
  it('rejects unknown keys (strict)', () => expectRejectsUnknownKey(petAssignmentSchema, { petIds: [VALID_UUID] }));
});