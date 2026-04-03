// Note interface = mirror DB schema
export interface PetNote {
    id: string;
    userId: string;
    petId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

// Form data 
export interface PetNoteFormData {
    content: string;
}

// API response types
export interface PetNotesApiResponse {
    notes: PetNote[];
    total: number;
}

export interface PetNoteApiResponse {
    note: PetNote;
}

// Error type
export interface PetNoteError {
    message: string;
    field?: keyof PetNoteFormData;
    code: string;
}