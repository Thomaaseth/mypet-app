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
  // extends the base with optional petIds, so base fields still pass.
  it('accepts the base vet fields (create is a superset of the base)', () => {
    expect(createVeterinarianSchema.safeParse(validVet).success).toBe(true);
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

describe('createVeterinarianSchema — petIds', () => {
  const validVet = { vetName: 'Dr. Jane Smith', phone: '555-123-4567', addressLine1: '123 Main St', city: 'Springfield', zipCode: '12345' };

  it('accepts a create body with no petIds', () => {
    expect(createVeterinarianSchema.safeParse(validVet).success).toBe(true);
  });
  it('accepts a create body with a valid petIds array', () => {
    expect(createVeterinarianSchema.safeParse({ ...validVet, petIds: ['123e4567-e89b-12d3-a456-426614174000'] }).success).toBe(true);
  });
  it('rejects a malformed petIds entry (not a uuid)', () => {
    expect(createVeterinarianSchema.safeParse({ ...validVet, petIds: ['not-a-uuid'] }).success).toBe(false);
  });
  it('still rejects a genuinely unknown key (strict preserved through extend)', () => {
    expect(createVeterinarianSchema.safeParse({ ...validVet, petIds: [], injected: true }).success).toBe(false);
  });
});