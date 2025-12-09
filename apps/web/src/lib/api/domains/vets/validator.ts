import type { VeterinarianFormData } from '@/types/veterinarian';
import { ValidationError } from '../../errors';

export class VetValidator {
  validateVetData(data: Partial<VeterinarianFormData>, isUpdate: boolean = false): void {
    // Required fields for creation
    if (!isUpdate) {
      this.validateVetName(data.vetName);
      this.validatePhone(data.phone);
      this.validateAddressLine1(data.addressLine1);
      this.validateCity(data.city);
      this.validateZipCode(data.zipCode);
    } else {
      // Optional validation for updates
      if (data.vetName !== undefined) this.validateVetName(data.vetName);
      if (data.phone !== undefined) this.validatePhone(data.phone);
      if (data.addressLine1 !== undefined) this.validateAddressLine1(data.addressLine1);
      if (data.city !== undefined) this.validateCity(data.city);
      if (data.zipCode !== undefined) this.validateZipCode(data.zipCode);
    }

    // Optional fields
    if (data.clinicName !== undefined) this.validateClinicName(data.clinicName);
    if (data.email !== undefined) this.validateEmail(data.email);
    if (data.website !== undefined) this.validateWebsite(data.website);
    if (data.addressLine2 !== undefined) this.validateAddressLine2(data.addressLine2);
    if (data.notes !== undefined) this.validateNotes(data.notes);
  }

  private validateVetName(vetName?: string): void {
    if (!vetName || vetName.trim().length === 0) {
      throw new ValidationError('Veterinarian name is required', 'vetName');
    }
    if (vetName.length > 100) {
      throw new ValidationError('Veterinarian name cannot exceed 100 characters', 'vetName');
    }
  }

  private validateClinicName(clinicName?: string): void {
    if (!clinicName || clinicName.trim() === '') return; // Optional
    if (clinicName.length > 150) {
      throw new ValidationError('Clinic name cannot exceed 150 characters', 'clinicName');
    }
  }

  private validatePhone(phone?: string): void {
    if (!phone || phone.trim().length === 0) {
      throw new ValidationError('Phone number is required', 'phone');
    }
    
    // Remove common formatting characters for validation
    const cleaned = phone.replace(/[\s\-\(\)\+\.]/g, '');
    
    if (!/^\d{7,15}$/.test(cleaned)) {
      throw new ValidationError('Phone number must be 7-15 digits', 'phone');
    }
  }

  private validateEmail(email?: string): void {
    if (!email || email.trim() === '') return; // Optional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Please enter a valid email address', 'email');
    }
    
    if (email.length > 100) {
      throw new ValidationError('Email cannot exceed 100 characters', 'email');
    }
  }

  private validateWebsite(website?: string): void {
    if (!website || website.trim() === '') return; // Optional
    
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(website)) {
      throw new ValidationError('Website must start with http:// or https://', 'website');
    }
    
    if (website.length > 255) {
      throw new ValidationError('Website URL cannot exceed 255 characters', 'website');
    }
  }

  private validateAddressLine1(addressLine1?: string): void {
    if (!addressLine1 || addressLine1.trim().length === 0) {
      throw new ValidationError('Address is required', 'addressLine1');
    }
    if (addressLine1.length > 255) {
      throw new ValidationError('Address cannot exceed 255 characters', 'addressLine1');
    }
  }

  private validateAddressLine2(addressLine2?: string): void {
    if (!addressLine2 || addressLine2.trim() === '') return; // Optional
    if (addressLine2.length > 255) {
      throw new ValidationError('Address line 2 cannot exceed 255 characters', 'addressLine2');
    }
  }

  private validateCity(city?: string): void {
    if (!city || city.trim().length === 0) {
      throw new ValidationError('City is required', 'city');
    }
    if (city.length > 100) {
      throw new ValidationError('City cannot exceed 100 characters', 'city');
    }
  }

  private validateZipCode(zipCode?: string): void {
    if (!zipCode || zipCode.trim().length === 0) {
      throw new ValidationError('ZIP/Postal code is required', 'zipCode');
    }
    if (zipCode.length > 20) {
      throw new ValidationError('ZIP/Postal code cannot exceed 20 characters', 'zipCode');
    }
  }

  private validateNotes(notes?: string): void {
    if (!notes || notes.trim() === '') return; // Optional
    if (notes.length > 1000) {
      throw new ValidationError('Notes cannot exceed 1000 characters', 'notes');
    }
  }

  transformVetData(data: Partial<VeterinarianFormData>): Partial<VeterinarianFormData> {
    const transformed = { ...data };

    // Trim string fields
    if (transformed.vetName) transformed.vetName = transformed.vetName.trim();
    if (transformed.clinicName) transformed.clinicName = transformed.clinicName.trim();
    if (transformed.phone) transformed.phone = transformed.phone.trim();
    if (transformed.email) transformed.email = transformed.email.trim();
    if (transformed.website) transformed.website = transformed.website.trim();
    if (transformed.addressLine1) transformed.addressLine1 = transformed.addressLine1.trim();
    if (transformed.addressLine2) transformed.addressLine2 = transformed.addressLine2.trim();
    if (transformed.city) transformed.city = transformed.city.trim();
    if (transformed.zipCode) transformed.zipCode = transformed.zipCode.trim();
    if (transformed.notes) transformed.notes = transformed.notes.trim();

    return transformed;
  }
}

// Default validator instance
export const vetValidator = new VetValidator();