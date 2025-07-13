import type { PetFormData } from '@/types/pet';
import { ValidationError } from '../../errors';

export class PetValidator {

  validatePetData(data: Partial<PetFormData>, isUpdate: boolean = false): void {
    // Name validation (required for creation, optional for updates)
    if (!isUpdate || data.name !== undefined) {
      this.validateName(data.name);
    }

    // Weight validation (optional)
    if (data.weight !== undefined) {
      this.validateWeight(data.weight);
    }

    // Birth date validation (optional)
    if (data.birthDate !== undefined) {
      this.validateBirthDate(data.birthDate);
    }

    // Microchip validation (optional)
    if (data.microchipNumber !== undefined) {
      this.validateMicrochip(data.microchipNumber);
    }

    // Notes validation (optional)
    if (data.notes !== undefined) {
      this.validateNotes(data.notes);
    }
  }

  private validateName(name?: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Pet name is required', 'name');
    }

    if (name.length > 50) {
      throw new ValidationError('Pet name cannot exceed 50 characters', 'name');
    }

    // Check for excessive special characters
    const specialCharCount = (name.match(/[^a-zA-Z0-9\s]/g) || []).length;
    if (specialCharCount > 2) {
      throw new ValidationError('Pet name contains too many special characters', 'name');
    }
  }

  private validateWeight(weight?: string): void {
    if (!weight || weight.trim() === '') return; // Weight is optional

    const numericWeight = parseFloat(weight.replace(',', '.'));
    
    if (isNaN(numericWeight)) {
      throw new ValidationError('Weight must be a valid number', 'weight');
    }

    if (numericWeight < 0.01) {
      throw new ValidationError('Weight must be greater than 0', 'weight');
    }

    if (numericWeight > 1000) {
      throw new ValidationError('Weight seems unrealistically high', 'weight');
    }
  }

  private validateBirthDate(birthDate?: string): void {
    if (!birthDate || birthDate.trim() === '') return; // Birth date is optional

    const date = new Date(birthDate);
    const now = new Date();

    if (isNaN(date.getTime())) {
      throw new ValidationError('Please enter a valid birth date', 'birthDate');
    }

    if (date > now) {
      throw new ValidationError('Birth date cannot be in the future', 'birthDate');
    }

    // Check for unreasonably old dates (50+ years)
    const fiftyYearsAgo = new Date();
    fiftyYearsAgo.setFullYear(now.getFullYear() - 50);
    
    if (date < fiftyYearsAgo) {
      throw new ValidationError('Birth date seems too far in the past', 'birthDate');
    }
  }

  private validateMicrochip(microchipNumber?: string): void {
    if (!microchipNumber || microchipNumber.trim() === '') return; // Microchip is optional

    // Remove spaces and dashes for validation
    const cleaned = microchipNumber.replace(/[\s-]/g, '');

    if (!/^\d{10,15}$/.test(cleaned)) {
      throw new ValidationError('Microchip number should be 10-15 digits', 'microchipNumber');
    }
  }

  private validateNotes(notes?: string): void {
    if (!notes) return; // Notes are optional

    if (notes.length > 1000) {
      throw new ValidationError('Notes cannot exceed 1000 characters', 'notes');
    }
  }

  transformPetData(data: Partial<PetFormData>): Partial<PetFormData> {
    const transformed = { ...data };

    // Normalize weight format
    if (transformed.weight) {
      transformed.weight = transformed.weight.replace(',', '.');
    }

    // Trim string fields
    if (transformed.name) {
      transformed.name = transformed.name.trim();
    }

    if (transformed.notes) {
      transformed.notes = transformed.notes.trim();
    }

    if (transformed.microchipNumber) {
      transformed.microchipNumber = transformed.microchipNumber.replace(/[\s-]/g, '');
    }

    return transformed;
  }
}

// Default validator instance
export const petValidator = new PetValidator();