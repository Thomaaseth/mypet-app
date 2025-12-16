export interface Veterinarian {
    id: string;
    userId: string;
    vetName: string;
    clinicName: string | null;
    phone: string;
    email: string | null;
    website: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    zipCode: string;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  // Extended veterinarian with pet assignment info
  export interface VeterinarianWithPets extends Veterinarian {
    assignedPetIds: string[];
  }
  
  // Form data types
  export interface VeterinarianFormData {
    vetName: string;
    clinicName: string;
    phone: string;
    email: string;
    website: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    zipCode: string;
    notes: string;
  }
  
  // Pet assignment types
  export interface PetAssignment {
    petId: string;
  }
  
  // API response types
  export interface VeterinariansApiResponse {
    veterinarians: Veterinarian[];
    total: number;
  }
  
  export interface VeterinarianApiResponse {
    veterinarian: Veterinarian;
  }
  
  export interface VetPetsApiResponse {
    pets: Array<{
      petId: string;
    }>;
  }
  
  // Error types
  export interface VeterinarianError {
    message: string;
    field?: keyof VeterinarianFormData;
    code?: string;
  }