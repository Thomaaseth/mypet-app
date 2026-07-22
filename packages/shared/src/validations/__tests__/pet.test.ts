import { describe, it, expect } from 'vitest';
import {
  petFormSchema,
  createPetSchema,
  updatePetSchema,
  petGenderSchema,
  weightUnitSchema,
} from '../pet';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

const validPet = {
  name: 'Whiskers',
  animalType: 'cat' as const,
  species: 'Siamese',
  gender: 'female' as const,
  birthDate: '2020-01-01',
  weight: '4.5',
  weightUnit: 'kg' as const,
  isNeutered: true,
  microchipNumber: 'ABC123',
  notes: 'Friendly cat',
};

describe('petGenderSchema', () => {
  it('accepts male, female, unknown', () => {
    expect(petGenderSchema.safeParse('male').success).toBe(true);
    expect(petGenderSchema.safeParse('female').success).toBe(true);
    expect(petGenderSchema.safeParse('unknown').success).toBe(true);
  });

  it('rejects an invalid gender', () => {
    expect(petGenderSchema.safeParse('other').success).toBe(false);
  });
  
});

describe('weightUnitSchema', () => {
  it('accepts kg and lbs', () => {
    expect(weightUnitSchema.safeParse('kg').success).toBe(true);
    expect(weightUnitSchema.safeParse('lbs').success).toBe(true);
  });

  it('rejects an invalid unit', () => {
    expect(weightUnitSchema.safeParse('stone').success).toBe(false);
  });
});

// petFormSchema and createPetSchema currently share identical validation
// logic (createPetSchema just re-extends `name`, which was already
// required). Both are tested in parallel so a future edit to only one of
// them shows up as a failure here instead of silently drifting.
describe.each([
  ['petFormSchema', petFormSchema],
  ['createPetSchema', createPetSchema],
])('%s', (_name, schema) => {
  it('accepts a well-formed pet', () => {
    expect(schema.safeParse(validPet).success).toBe(true);
  });

  it('rejects missing name', () => {
    expect(schema.safeParse({ ...validPet, name: '' }).success).toBe(false);
  });

  it('rejects a name with disallowed characters (digits)', () => {
    expect(schema.safeParse({ ...validPet, name: 'Rex3' }).success).toBe(false);
  });

  it('accepts a name with accented letters', () => {
    expect(schema.safeParse({ ...validPet, name: 'André' }).success).toBe(true);
  });

  it('rejects an invalid animalType', () => {
    expect(schema.safeParse({ ...validPet, animalType: 'bird' }).success).toBe(false);
  });

  it('accepts an empty species', () => {
    expect(schema.safeParse({ ...validPet, species: '' }).success).toBe(true);
  });

  it('rejects an invalid gender', () => {
    expect(schema.safeParse({ ...validPet, gender: 'other' }).success).toBe(false);
  });

  it('accepts a missing birthDate', () => {
    const { birthDate, ...rest } = validPet;
    expect(schema.safeParse(rest).success).toBe(true);
  });

  it('accepts an empty birthDate', () => {
    expect(schema.safeParse({ ...validPet, birthDate: '' }).success).toBe(true);
  });

  it('rejects an unparseable birthDate', () => {
    expect(schema.safeParse({ ...validPet, birthDate: 'not-a-date' }).success).toBe(false);
  });

  // Regression guards: future-date and max-age business rules were
  // intentionally removed from this schema and now live server-side only
  // in PetsService.validatePetInputs (30-year threshold).
  it('does NOT reject a future birthDate', () => {
    expect(schema.safeParse({ ...validPet, birthDate: '2099-01-01' }).success).toBe(true);
  });

  it('does NOT reject a birthDate older than 30 years', () => {
    expect(schema.safeParse({ ...validPet, birthDate: '1970-01-01' }).success).toBe(true);
  });

  it('rejects an invalid weightUnit', () => {
    expect(schema.safeParse({ ...validPet, weightUnit: 'stone' }).success).toBe(false);
  });

  it('requires weightUnit even when weight is not provided', () => {
    const { weight, weightUnit, ...rest } = validPet;
    expect(schema.safeParse(rest).success).toBe(false);
  });

  it('accepts a missing weight (as long as weightUnit is present)', () => {
    const { weight, ...rest } = validPet;
    expect(schema.safeParse(rest).success).toBe(true);
  });

  it('rejects a non-positive weight when provided', () => {
    expect(schema.safeParse({ ...validPet, weight: '0' }).success).toBe(false);
    expect(schema.safeParse({ ...validPet, weight: '-1' }).success).toBe(false);
  });

  it('accepts weight at exactly the 200kg boundary', () => {
    expect(schema.safeParse({ ...validPet, weight: '200', weightUnit: 'kg' }).success).toBe(true);
  });

  it('rejects weight just above the 200kg boundary', () => {
    expect(schema.safeParse({ ...validPet, weight: '200.1', weightUnit: 'kg' }).success).toBe(false);
  });

  it('accepts weight at exactly the 440lbs boundary', () => {
    expect(schema.safeParse({ ...validPet, weight: '440', weightUnit: 'lbs' }).success).toBe(true);
  });

  it('rejects weight just above the 440lbs boundary', () => {
    expect(schema.safeParse({ ...validPet, weight: '440.1', weightUnit: 'lbs' }).success).toBe(false);
  });

  it('rejects an invalid microchipNumber (disallowed characters)', () => {
    expect(schema.safeParse({ ...validPet, microchipNumber: 'ABC-123@' }).success).toBe(false);
  });

  it('rejects a microchipNumber over 20 characters', () => {
    expect(schema.safeParse({ ...validPet, microchipNumber: 'A'.repeat(21) }).success).toBe(false);
  });

  it('rejects notes over 1000 characters', () => {
    expect(schema.safeParse({ ...validPet, notes: 'x'.repeat(1001) }).success).toBe(false);
  });

  it('rejects isNeutered as a non-boolean', () => {
    expect(schema.safeParse({ ...validPet, isNeutered: 'true' }).success).toBe(false);
  });
});

describe('updatePetSchema', () => {
  it('accepts an update with just a valid id', () => {
    expect(updatePetSchema.safeParse({ id: VALID_UUID }).success).toBe(true);
  });

  it('rejects an invalid uuid', () => {
    expect(updatePetSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });

  it('requires an id', () => {
    expect(updatePetSchema.safeParse({ name: 'Rex' }).success).toBe(false);
  });

  it('accepts a partial update to just the name', () => {
    expect(updatePetSchema.safeParse({ id: VALID_UUID, name: 'Rex' }).success).toBe(true);
  });

  it('does NOT reject a future birthDate on update', () => {
    expect(updatePetSchema.safeParse({ id: VALID_UUID, birthDate: '2099-01-01' }).success).toBe(true);
  });

  it('does NOT reject a birthDate older than 30 years on update', () => {
    expect(updatePetSchema.safeParse({ id: VALID_UUID, birthDate: '1970-01-01' }).success).toBe(true);
  });

  it('rejects an unparseable birthDate on update', () => {
    expect(updatePetSchema.safeParse({ id: VALID_UUID, birthDate: 'nope' }).success).toBe(false);
  });

  // weight/weightUnit are intentionally omitted from this schema — a pet's
  // weight isn't updatable through this endpoint. Zod silently strips
  // unrecognized keys (no .strict() on this schema), so passing `weight`
  // doesn't cause a rejection — it's just discarded. This test pins down
  // that "silently ignored" behavior so it's a documented decision, not an
  // accident someone discovers later.
  it('silently strips a weight field if present, without rejecting or applying it', () => {
    const result = updatePetSchema.safeParse({ id: VALID_UUID, weight: '999999' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).weight).toBeUndefined();
    }
  });
});