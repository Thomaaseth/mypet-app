import { describe, it, expect } from 'vitest';
// Shared source of truth — the exact schemas the form resolver and the server use.
import { validatePetEditForm, validateUpdatePet } from '@/shared/validations/pet';
import type { PetEditFormData } from '@/shared/validations/pet';

// Server injects id from the URL path before validating the update (see
// pets.routes PUT /:id). Mirror that here.
const PET_ID = '22222222-2222-4222-8222-222222222222';

const typicalEdit: PetEditFormData = {
  name: 'Whiskers',
  animalType: 'cat',
  species: 'Siamese',
  gender: 'female',
  birthDate: '2020-01-01',
  isNeutered: true,
  microchipNumber: 'ABC12345',
  notes: 'Friendly',
};

describe('pet edit form ↔ server update contract', () => {
  it('a valid edit submission passes the edit form schema', () => {
    expect(validatePetEditForm(typicalEdit).success).toBe(true);
  });

  it('the edit submission (+ server-injected id) satisfies updatePetSchema', () => {
    expect(validateUpdatePet({ ...typicalEdit, id: PET_ID }).success).toBe(true);
  });

  it('the edit form schema rejects a leaked weight/weightUnit', () => {
    const leaked = { ...typicalEdit, weight: '5', weightUnit: 'kg' };
    expect(validatePetEditForm(leaked).success).toBe(false);
  });

  it('name stays required on edit (not a partial patch)', () => {
    expect(validatePetEditForm({}).success).toBe(false);
  });
});