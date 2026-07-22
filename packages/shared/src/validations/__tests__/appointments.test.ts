import { describe, it, expect } from 'vitest';
import {
  appointmentFormSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  updateVisitNotesSchema,
  validateCreateAppointment,
  validateUpdateAppointment,
  validateUpdateVisitNotes,
  appointmentTypes,
} from '../appointments';

const VALID_PET_ID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_VET_ID = '987e6543-e21b-12d3-a456-426614174999';

const valid = {
  petId: VALID_PET_ID,
  veterinarianId: VALID_VET_ID,
  appointmentDate: '2026-08-15',
  appointmentTime: '14:05',
  appointmentType: 'checkup' as const,
  reasonForVisit: 'Annual checkup',
  visitNotes: '',
};

describe('appointmentFormSchema', () => {
  it('accepts a well-formed appointment', () => {
    expect(appointmentFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a missing petId', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, petId: '' }).success).toBe(false);
  });

  it('rejects a non-uuid petId', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, petId: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects a missing veterinarianId', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, veterinarianId: '' }).success).toBe(false);
  });

  it('rejects a non-uuid veterinarianId', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, veterinarianId: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects a missing appointmentDate', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, appointmentDate: '' }).success).toBe(false);
  });

  it('rejects an unparseable appointmentDate', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, appointmentDate: 'not-a-date' }).success).toBe(false);
  });

  // This schema never had a future-date restriction (appointments are
  // inherently forward-looking), and the past-date restriction was
  // deliberately removed (see the comment above createAppointmentSchema).
  // Both directions are open by design — pin both down explicitly.
  it('accepts a future appointmentDate', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, appointmentDate: '2099-01-01' }).success).toBe(true);
  });

  it('accepts a past appointmentDate', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, appointmentDate: '2000-01-01' }).success).toBe(true);
  });

  describe('appointmentTime format', () => {
    it('accepts valid HH:MM times on 5-minute increments', () => {
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: '00:00' }).success).toBe(true);
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: '09:00' }).success).toBe(true);
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: '23:55' }).success).toBe(true);
    });

    it('rejects a missing appointmentTime', () => {
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: '' }).success).toBe(false);
    });

    it('rejects an hour without a leading zero', () => {
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: '9:00' }).success).toBe(false);
    });

    it('rejects an out-of-range hour', () => {
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: '24:00' }).success).toBe(false);
    });

    it('rejects an out-of-range minute', () => {
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: '12:60' }).success).toBe(false);
    });

    it('rejects a non-5-minute increment', () => {
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: '14:07' }).success).toBe(false);
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: '14:01' }).success).toBe(false);
    });

    it('accepts every 5-minute increment within an hour', () => {
      for (let m = 0; m < 60; m += 5) {
        const time = `10:${m.toString().padStart(2, '0')}`;
        expect(appointmentFormSchema.safeParse({ ...valid, appointmentTime: time }).success).toBe(true);
      }
    });
  });

  describe('appointmentType', () => {
    it('accepts every defined appointment type', () => {
      for (const type of appointmentTypes) {
        expect(appointmentFormSchema.safeParse({ ...valid, appointmentType: type }).success).toBe(true);
      }
    });

    it('rejects an invalid appointmentType', () => {
      expect(appointmentFormSchema.safeParse({ ...valid, appointmentType: 'bathing' }).success).toBe(false);
    });
  });

  it('accepts an empty reasonForVisit', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, reasonForVisit: '' }).success).toBe(true);
  });

  it('rejects reasonForVisit over 100 characters', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, reasonForVisit: 'x'.repeat(101) }).success).toBe(false);
  });

  it('accepts an empty visitNotes', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, visitNotes: '' }).success).toBe(true);
  });

  it('rejects visitNotes over 200 characters', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, visitNotes: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('createAppointmentSchema', () => {
  it('is the same schema as appointmentFormSchema (no extra create-only rules)', () => {
    expect(createAppointmentSchema).toBe(appointmentFormSchema);
  });

  it('accepts a past-dated appointment on create', () => {
    expect(createAppointmentSchema.safeParse({ ...valid, appointmentDate: '2020-01-01' }).success).toBe(true);
  });
});

describe('updateAppointmentSchema', () => {
  const validUpdate = { ...valid, id: VALID_PET_ID };

  it('accepts a well-formed update', () => {
    expect(updateAppointmentSchema.safeParse(validUpdate).success).toBe(true);
  });

  it('requires a valid uuid id', () => {
    expect(updateAppointmentSchema.safeParse({ ...validUpdate, id: 'not-a-uuid' }).success).toBe(false);
    expect(updateAppointmentSchema.safeParse(valid).success).toBe(false); // no id at all
  });

  it('still enforces the base schema fields (e.g. valid time)', () => {
    expect(updateAppointmentSchema.safeParse({ ...validUpdate, appointmentTime: '14:07' }).success).toBe(false);
  });
});

describe('updateVisitNotesSchema', () => {
  it('accepts an empty object (visitNotes is optional)', () => {
    expect(updateVisitNotesSchema.safeParse({}).success).toBe(true);
  });

  it('accepts an empty string', () => {
    expect(updateVisitNotesSchema.safeParse({ visitNotes: '' }).success).toBe(true);
  });

  it('accepts well-formed notes', () => {
    expect(updateVisitNotesSchema.safeParse({ visitNotes: 'Went well, no concerns.' }).success).toBe(true);
  });

  it('rejects notes over 200 characters', () => {
    expect(updateVisitNotesSchema.safeParse({ visitNotes: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('throwing/safeParse validate* helpers', () => {
  it('validateCreateAppointment returns success for valid data', () => {
    expect(validateCreateAppointment(valid).success).toBe(true);
  });

  it('validateCreateAppointment returns failure for invalid data', () => {
    expect(validateCreateAppointment({}).success).toBe(false);
  });

  it('validateUpdateAppointment returns success for valid data', () => {
    expect(validateUpdateAppointment({ ...valid, id: VALID_PET_ID }).success).toBe(true);
  });

  it('validateUpdateVisitNotes returns success for valid data', () => {
    expect(validateUpdateVisitNotes({ visitNotes: 'All good' }).success).toBe(true);
  });
});