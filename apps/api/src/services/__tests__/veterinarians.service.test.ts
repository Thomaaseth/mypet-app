import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';
import type { NewVeterinarian } from '../../db/schema/veterinarians';
import { BadRequestError, NotFoundError } from '../../middleware/errors';
import { VeterinariansService } from '../veterinarians.service';
import { db } from '../../db';
import { DatabaseTestUtils } from '../../test/database-test-utils';

describe('VeterinariansService', () => {
  describe('getUserVeterinarians', () => {
    it('should return all active veterinarians for a user', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      await db.insert(schema.veterinarians).values([
        {
          userId: primary.id,
          vetName: 'Dr. Smith',
          clinicName: 'City Animal Clinic',
          phone: '555-1234',
          addressLine1: '123 Main St',
          city: 'Boston',
          zipCode: '02101',
          isActive: true,
        },
        {
          userId: primary.id,
          vetName: 'Dr. Johnson',
          clinicName: 'Pet Care Center',
          phone: '555-5678',
          addressLine1: '456 Oak Ave',
          city: 'Cambridge',
          zipCode: '02138',
          isActive: true,
        },
      ]);

      const result = await VeterinariansService.getUserVeterinarians(primary.id);

      expect(result).toHaveLength(2);
      expect(result.every(vet => vet.userId === primary.id)).toBe(true);
      expect(result.every(vet => vet.isActive)).toBe(true);
      
      const names = result.map(vet => vet.vetName);
      expect(names).toContain('Dr. Smith');
      expect(names).toContain('Dr. Johnson');
    });

    it('should return veterinarians in creation order', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      const [firstVet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'First Vet',
        phone: '555-0001',
        addressLine1: '123 First St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const [secondVet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Second Vet',
        phone: '555-0002',
        addressLine1: '456 Second St',
        city: 'Cambridge',
        zipCode: '02138',
      }).returning();

      const result = await VeterinariansService.getUserVeterinarians(primary.id);

      expect(result).toHaveLength(2);
      expect(result[0].vetName).toBe('First Vet');
      expect(result[1].vetName).toBe('Second Vet');
    });

    it('should not return inactive veterinarians', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      await db.insert(schema.veterinarians).values([
        {
          userId: primary.id,
          vetName: 'Active Vet',
          phone: '555-1111',
          addressLine1: '123 Active St',
          city: 'Boston',
          zipCode: '02101',
          isActive: true,
        },
        {
          userId: primary.id,
          vetName: 'Inactive Vet',
          phone: '555-2222',
          addressLine1: '456 Inactive St',
          city: 'Cambridge',
          zipCode: '02138',
          isActive: false,
        },
      ]);

      const result = await VeterinariansService.getUserVeterinarians(primary.id);

      expect(result).toHaveLength(1);
      expect(result[0].vetName).toBe('Active Vet');
    });

    it('should return empty array when user has no veterinarians', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      const result = await VeterinariansService.getUserVeterinarians(primary.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should only return veterinarians for the specified user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();

      await db.insert(schema.veterinarians).values([
        {
          userId: primary.id,
          vetName: 'My Vet',
          phone: '555-1111',
          addressLine1: '123 Main St',
          city: 'Boston',
          zipCode: '02101',
        },
        {
          userId: secondary.id,
          vetName: 'Other Vet',
          phone: '555-2222',
          addressLine1: '456 Oak St',
          city: 'Cambridge',
          zipCode: '02138',
        },
      ]);

      const result = await VeterinariansService.getUserVeterinarians(primary.id);

      expect(result).toHaveLength(1);
      expect(result[0].vetName).toBe('My Vet');
      expect(result[0].userId).toBe(primary.id);
    });

    it('should throw BadRequestError when userId is empty', async () => {
      await expect(
        VeterinariansService.getUserVeterinarians('')
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when userId is invalid type', async () => {
      await expect(
        VeterinariansService.getUserVeterinarians(null as any)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getVeterinarianById', () => {
    it('should return veterinarian when found and belongs to user', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [insertedVet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Smith',
        clinicName: 'City Vet',
        phone: '555-1234',
        email: 'smith@cityvet.com',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      const result = await VeterinariansService.getVeterinarianById(insertedVet.id, primary.id);

      expect(result.id).toBe(insertedVet.id);
      expect(result.vetName).toBe('Dr. Smith');
      expect(result.userId).toBe(primary.id);
      expect(result.clinicName).toBe('City Vet');
    });

    it('should throw NotFoundError when veterinarian does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const nonExistentId = randomUUID();
      
      await expect(
        VeterinariansService.getVeterinarianById(nonExistentId, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when veterinarian belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();

      const [insertedVet] = await db.insert(schema.veterinarians).values({
        userId: secondary.id,
        vetName: 'Other User Vet',
        phone: '555-9999',
        addressLine1: '999 Private St',
        city: 'Somerville',
        zipCode: '02144',
      }).returning();

      await expect(
        VeterinariansService.getVeterinarianById(insertedVet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when veterinarian is inactive', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [insertedVet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Inactive Vet',
        phone: '555-0000',
        addressLine1: '000 Closed St',
        city: 'Boston',
        zipCode: '02101',
        isActive: false,
      }).returning();

      await expect(
        VeterinariansService.getVeterinarianById(insertedVet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError for invalid UUID format', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      await expect(
        VeterinariansService.getVeterinarianById('invalid-uuid', primary.id)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('createVeterinarian', () => {
    it('should create veterinarian with valid data', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newVetData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        clinicName: 'City Animal Clinic',
        phone: '555-1234',
        email: 'smith@cityvet.com',
        website: 'www.cityvet.com',
        addressLine1: '123 Main St',
        addressLine2: 'Suite 200',
        city: 'Boston',
        zipCode: '02101',
        notes: 'Specializes in cats',
      };

      const result = await VeterinariansService.createVeterinarian(newVetData);

      expect(result.vetName).toBe('Dr. Smith');
      expect(result.userId).toBe(primary.id);
      expect(result.clinicName).toBe('City Animal Clinic');
      expect(result.phone).toBe('555-1234');
      expect(result.email).toBe('smith@cityvet.com');
      expect(result.website).toBe('www.cityvet.com');
      expect(result.addressLine1).toBe('123 Main St');
      expect(result.addressLine2).toBe('Suite 200');
      expect(result.city).toBe('Boston');
      expect(result.zipCode).toBe('02101');
      expect(result.notes).toBe('Specializes in cats');
      expect(result.isActive).toBe(true);
      expect(result.id).toBeDefined();
      
      const savedVets = await db.select()
        .from(schema.veterinarians)
        .where(eq(schema.veterinarians.userId, primary.id));
      expect(savedVets).toHaveLength(1);
      expect(savedVets[0].vetName).toBe('Dr. Smith');
    });

    it('should create veterinarian with minimal required data', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newVetData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Minimal',
        phone: '555-0000',
        addressLine1: '100 Basic St',
        city: 'Boston',
        zipCode: '02101',
      };

      const result = await VeterinariansService.createVeterinarian(newVetData);

      expect(result.vetName).toBe('Dr. Minimal');
      expect(result.userId).toBe(primary.id);
      expect(result.phone).toBe('555-0000');
      expect(result.addressLine1).toBe('100 Basic St');
      expect(result.city).toBe('Boston');
      expect(result.zipCode).toBe('02101');
      expect(result.clinicName).toBeNull();
      expect(result.email).toBeNull();
      expect(result.website).toBeNull();
      expect(result.addressLine2).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should create veterinarian and assign to pets if petIds provided', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 2);
      
      const newVetData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Multi-Pet',
        phone: '555-7777',
        addressLine1: '777 Pet St',
        city: 'Boston',
        zipCode: '02101',
      };

      const result = await VeterinariansService.createVeterinarian(
        newVetData, 
        [pets[0].id, pets[1].id]
      );

      expect(result.id).toBeDefined();

      // Verify assignments were created
      const assignments = await db.select()
        .from(schema.petVeterinarians)
        .where(eq(schema.petVeterinarians.veterinarianId, result.id));

      expect(assignments).toHaveLength(2);
      expect(assignments.map(a => a.petId)).toContain(pets[0].id);
      expect(assignments.map(a => a.petId)).toContain(pets[1].id);
    });

    it('should throw BadRequestError when vetName is missing', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData = {
        userId: primary.id,
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      } as NewVeterinarian;

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('Veterinarian name is required');
    });

    it('should throw BadRequestError when phone is missing', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      } as NewVeterinarian;

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('Phone number is required');
    });

    it('should throw BadRequestError when addressLine1 is missing', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        phone: '555-1234',
        city: 'Boston',
        zipCode: '02101',
      } as NewVeterinarian;

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('Address is required');
    });

    it('should throw BadRequestError when city is missing', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        phone: '555-1234',
        addressLine1: '123 Main St',
        zipCode: '02101',
      } as NewVeterinarian;

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('City is required');
    });

    it('should throw BadRequestError when zipCode is missing', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
      } as NewVeterinarian;

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('ZIP code is required');
    });

    it('should throw BadRequestError when vetName is empty string', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData: NewVeterinarian = {
        userId: primary.id,
        vetName: '',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      };

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when vetName is only whitespace', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData: NewVeterinarian = {
        userId: primary.id,
        vetName: '   ',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      };

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for invalid email format', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        phone: '555-1234',
        email: 'invalid-email',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      };

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw BadRequestError for invalid website format', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        phone: '555-1234',
        website: 'not-a-website',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      };

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('valid website');
    });

    it('should throw BadRequestError when vetName exceeds 100 characters', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const longName = 'A'.repeat(101);
      const invalidData: NewVeterinarian = {
        userId: primary.id,
        vetName: longName,
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      };

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('must be less than 100 characters');
    });

    it('should throw BadRequestError when clinicName exceeds 100 characters', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const longClinicName = 'B'.repeat(101);
      const invalidData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        clinicName: longClinicName,
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      };

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('Clinic name must be less than 100 characters');
    });

    it('should throw BadRequestError when phone exceeds 20 characters', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const longPhone = '1'.repeat(21);
      const invalidData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        phone: longPhone,
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      };

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('Phone number must be less than 20 characters');
    });

    it('should throw BadRequestError when email exceeds 100 characters', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const longEmail = 'a'.repeat(90) + '@example.com'; // 102 chars
      const invalidData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        phone: '555-1234',
        email: longEmail,
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      };

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when notes exceed 100 characters', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const longNotes = 'N'.repeat(101);
      const invalidData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
        notes: longNotes,
      };

      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.createVeterinarian(invalidData)
      ).rejects.toThrow('Notes must be less than 100 characters');
    });

    it('should convert empty strings to null for optional fields', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newVetData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Dr. Smith',
        clinicName: '',
        phone: '555-1234',
        email: '',
        website: '',
        addressLine1: '123 Main St',
        addressLine2: '',
        city: 'Boston',
        zipCode: '02101',
        notes: '',
      };

      const result = await VeterinariansService.createVeterinarian(newVetData);

      expect(result.clinicName).toBeNull();
      expect(result.email).toBeNull();
      expect(result.website).toBeNull();
      expect(result.addressLine2).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should accept valid website formats', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      const validWebsites = [
        'www.example.com',
        'example.com',
        'https://example.com',
        'http://www.example.com',
        'subdomain.example.com',
      ];

      for (const website of validWebsites) {
        const vetData: NewVeterinarian = {
          userId: primary.id,
          vetName: `Dr. ${website}`,
          phone: '555-1234',
          website: website,
          addressLine1: '123 Main St',
          city: 'Boston',
          zipCode: '02101',
        };

        const result = await VeterinariansService.createVeterinarian(vetData);
        expect(result.website).toBe(website);
      }
    });

    it('should accept valid email formats', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      const validEmails = [
        'simple@example.com',
        'very.common@example.com',
        'user+tag@example.co.uk',
        'test_email@subdomain.example.com',
      ];

      for (const email of validEmails) {
        const vetData: NewVeterinarian = {
          userId: primary.id,
          vetName: `Dr. ${email}`,
          phone: '555-1234',
          email: email,
          addressLine1: '123 Main St',
          city: 'Boston',
          zipCode: '02101',
        };

        const result = await VeterinariansService.createVeterinarian(vetData);
        expect(result.email).toBe(email);
      }
    });
  });

  describe('updateVeterinarian', () => {
    it('should update veterinarian with valid data', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Original Name',
        phone: '555-0000',
        addressLine1: '100 Old St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      const updateData = {
        vetName: 'Updated Name',
        clinicName: 'New Clinic',
        email: 'updated@example.com',
      };

      const result = await VeterinariansService.updateVeterinarian(
        vet.id, 
        primary.id, 
        updateData
      );

      expect(result.vetName).toBe('Updated Name');
      expect(result.clinicName).toBe('New Clinic');
      expect(result.email).toBe('updated@example.com');
      expect(result.updatedAt).toBeDefined();
    });

    it('should update only provided fields', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Original',
        clinicName: 'Original Clinic',
        phone: '555-1111',
        addressLine1: '111 Original St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      const updateData = { vetName: 'Dr. Updated Only' };

      const result = await VeterinariansService.updateVeterinarian(
        vet.id, 
        primary.id, 
        updateData
      );

      expect(result.vetName).toBe('Dr. Updated Only');
      expect(result.clinicName).toBe('Original Clinic');
      expect(result.phone).toBe('555-1111');
    });

    it('should convert empty strings to null', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Test',
        clinicName: 'Test Clinic',
        phone: '555-1234',
        email: 'test@example.com',
        website: 'www.test.com',
        addressLine1: '123 Main St',
        addressLine2: 'Suite 100',
        city: 'Boston',
        zipCode: '02101',
        notes: 'Some notes',
      }).returning();

      const updateData = {
        clinicName: '',
        email: '',
        website: '',
        addressLine2: '',
        notes: '',
      };

      const result = await VeterinariansService.updateVeterinarian(
        vet.id, 
        primary.id, 
        updateData
      );

      expect(result.clinicName).toBeNull();
      expect(result.email).toBeNull();
      expect(result.website).toBeNull();
      expect(result.addressLine2).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should throw NotFoundError when veterinarian does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const nonExistentId = randomUUID();
      const updateData = { vetName: 'New Name' };

      await expect(
        VeterinariansService.updateVeterinarian(nonExistentId, primary.id, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when veterinarian belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: secondary.id,
        vetName: 'Other User Vet',
        phone: '555-9999',
        addressLine1: '999 Private St',
        city: 'Cambridge',
        zipCode: '02138',
      }).returning();

      const updateData = { vetName: 'Hacker Name' };

      await expect(
        VeterinariansService.updateVeterinarian(vet.id, primary.id, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when veterinarian is inactive', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Inactive Vet',
        phone: '555-0000',
        addressLine1: '000 Closed St',
        city: 'Boston',
        zipCode: '02101',
        isActive: false,
      }).returning();

      const updateData = { vetName: 'Should Not Work' };

      await expect(
        VeterinariansService.updateVeterinarian(vet.id, primary.id, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError for invalid UUID format', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const updateData = { vetName: 'New Name' };

      await expect(
        VeterinariansService.updateVeterinarian('invalid-uuid', primary.id, updateData)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when no fields provided for update', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Test',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      await expect(
        VeterinariansService.updateVeterinarian(vet.id, primary.id, {})
      ).rejects.toThrow(BadRequestError);
      await expect(
        VeterinariansService.updateVeterinarian(vet.id, primary.id, {})
      ).rejects.toThrow('At least one field must be provided for update');
    });

    it('should throw BadRequestError for invalid email format on update', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Test',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      const updateData = { email: 'invalid-email' };

      await expect(
        VeterinariansService.updateVeterinarian(vet.id, primary.id, updateData)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for invalid website format on update', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Test',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      const updateData = { website: 'not-valid' };

      await expect(
        VeterinariansService.updateVeterinarian(vet.id, primary.id, updateData)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when field exceeds max length on update', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Test',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      const updateData = { vetName: 'A'.repeat(101) };

      await expect(
        VeterinariansService.updateVeterinarian(vet.id, primary.id, updateData)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteVeterinarian (soft delete)', () => {
    it('should soft delete veterinarian', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Vet to Delete',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      await VeterinariansService.deleteVeterinarian(vet.id, primary.id);

      const [deletedVet] = await db.select()
        .from(schema.veterinarians)
        .where(eq(schema.veterinarians.id, vet.id));

      expect(deletedVet.isActive).toBe(false);
      expect(deletedVet.updatedAt).toBeDefined();
    });

    it('should unassign veterinarian from all pets on delete', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 2);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Vet to Delete',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      // Assign vet to pets
      await db.insert(schema.petVeterinarians).values([
        { petId: pets[0].id, veterinarianId: vet.id },
        { petId: pets[1].id, veterinarianId: vet.id },
      ]);

      // Verify assignments exist
      const assignmentsBefore = await db.select()
        .from(schema.petVeterinarians)
        .where(eq(schema.petVeterinarians.veterinarianId, vet.id));
      expect(assignmentsBefore).toHaveLength(2);

      // Delete vet
      await VeterinariansService.deleteVeterinarian(vet.id, primary.id);

      // Verify assignments are removed
      const assignmentsAfter = await db.select()
        .from(schema.petVeterinarians)
        .where(eq(schema.petVeterinarians.veterinarianId, vet.id));
      expect(assignmentsAfter).toHaveLength(0);
    });

    it('should not affect getVeterinarianById after soft delete', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Vet to Delete',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      await VeterinariansService.deleteVeterinarian(vet.id, primary.id);

      await expect(
        VeterinariansService.getVeterinarianById(vet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when veterinarian does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const nonExistentId = randomUUID();

      await expect(
        VeterinariansService.deleteVeterinarian(nonExistentId, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when veterinarian belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: secondary.id,
        vetName: 'Other User Vet',
        phone: '555-9999',
        addressLine1: '999 Private St',
        city: 'Cambridge',
        zipCode: '02138',
      }).returning();

      await expect(
        VeterinariansService.deleteVeterinarian(vet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('assignVetToPets', () => {
    it('should assign veterinarian to multiple pets', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 3);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Multi-Pet',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      await VeterinariansService.assignVetToPets(
        vet.id, 
        primary.id, 
        [pets[0].id, pets[1].id, pets[2].id]
      );

      const assignments = await db.select()
        .from(schema.petVeterinarians)
        .where(eq(schema.petVeterinarians.veterinarianId, vet.id));

      expect(assignments).toHaveLength(3);
      expect(assignments.map(a => a.petId)).toContain(pets[0].id);
      expect(assignments.map(a => a.petId)).toContain(pets[1].id);
      expect(assignments.map(a => a.petId)).toContain(pets[2].id);
    });

    it('should handle reassignment (idempotent)', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 2);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Reassign',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      // Assign first time
      await VeterinariansService.assignVetToPets(
        vet.id, 
        primary.id, 
        [pets[0].id, pets[1].id]
      );

      // Assign again (should not error)
      await VeterinariansService.assignVetToPets(
        vet.id, 
        primary.id, 
        [pets[0].id, pets[1].id]
      );

      const assignments = await db.select()
        .from(schema.petVeterinarians)
        .where(eq(schema.petVeterinarians.veterinarianId, vet.id));

      // Should still have exactly 2 assignments (no duplicates)
      expect(assignments).toHaveLength(2);
    });

    it('should throw NotFoundError when veterinarian does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const nonExistentVetId = randomUUID();

      await expect(
        VeterinariansService.assignVetToPets(nonExistentVetId, primary.id, [pets[0].id])
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Test',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();
      const nonExistentPetId = randomUUID();

      await expect(
        VeterinariansService.assignVetToPets(vet.id, primary.id, [nonExistentPetId])
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const otherUserPets = await DatabaseTestUtils.createTestPets(secondary.id, 1);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Test',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      await expect(
        VeterinariansService.assignVetToPets(vet.id, primary.id, [otherUserPets[0].id])
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when veterinarian belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: secondary.id,
        vetName: 'Other User Vet',
        phone: '555-9999',
        addressLine1: '999 Private St',
        city: 'Cambridge',
        zipCode: '02138',
      }).returning();

      await expect(
        VeterinariansService.assignVetToPets(vet.id, primary.id, [pets[0].id])
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('unassignVetFromPets', () => {
    it('should unassign veterinarian from pets', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 3);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Unassign',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      // First assign
      await db.insert(schema.petVeterinarians).values([
        { petId: pets[0].id, veterinarianId: vet.id },
        { petId: pets[1].id, veterinarianId: vet.id },
        { petId: pets[2].id, veterinarianId: vet.id },
      ]);

      // Unassign from 2 pets
      await VeterinariansService.unassignVetFromPets(
        vet.id, 
        primary.id, 
        [pets[0].id, pets[1].id]
      );

      const assignments = await db.select()
        .from(schema.petVeterinarians)
        .where(eq(schema.petVeterinarians.veterinarianId, vet.id));

      expect(assignments).toHaveLength(1);
      expect(assignments[0].petId).toBe(pets[2].id);
    });

    it('should handle unassigning non-assigned pets gracefully', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 2);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Test',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      // Pet is not assigned, but unassign should not error
      await expect(
        VeterinariansService.unassignVetFromPets(vet.id, primary.id, [pets[0].id])
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundError when veterinarian does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const nonExistentVetId = randomUUID();

      await expect(
        VeterinariansService.unassignVetFromPets(nonExistentVetId, primary.id, [pets[0].id])
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when veterinarian belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: secondary.id,
        vetName: 'Other User Vet',
        phone: '555-9999',
        addressLine1: '999 Private St',
        city: 'Cambridge',
        zipCode: '02138',
      }).returning();

      await expect(
        VeterinariansService.unassignVetFromPets(vet.id, primary.id, [pets[0].id])
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getVetPets', () => {
    it('should return all pets assigned to veterinarian', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 3);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Multi-Pet',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      await db.insert(schema.petVeterinarians).values([
        { petId: pets[0].id, veterinarianId: vet.id },
        { petId: pets[1].id, veterinarianId: vet.id },
        { petId: pets[2].id, veterinarianId: vet.id },
      ]);

      const result = await VeterinariansService.getVetPets(vet.id, primary.id);

      expect(result).toHaveLength(3);
      expect(result.map(r => r.petId)).toContain(pets[0].id);
      expect(result.map(r => r.petId)).toContain(pets[1].id);
      expect(result.map(r => r.petId)).toContain(pets[2].id);
    });

    it('should return empty array when no pets assigned', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. No Pets',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      const result = await VeterinariansService.getVetPets(vet.id, primary.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundError when veterinarian does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const nonExistentId = randomUUID();

      await expect(
        VeterinariansService.getVetPets(nonExistentId, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when veterinarian belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: secondary.id,
        vetName: 'Other User Vet',
        phone: '555-9999',
        addressLine1: '999 Private St',
        city: 'Cambridge',
        zipCode: '02138',
      }).returning();

      await expect(
        VeterinariansService.getVetPets(vet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPetVeterinarians', () => {
    it('should return all veterinarians for a pet', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      const vets = await db.insert(schema.veterinarians).values([
        {
          userId: primary.id,
          vetName: 'Dr. First',
          phone: '555-0001',
          addressLine1: '123 First St',
          city: 'Boston',
          zipCode: '02101',
        },
        {
          userId: primary.id,
          vetName: 'Dr. Second',
          phone: '555-0002',
          addressLine1: '456 Second St',
          city: 'Cambridge',
          zipCode: '02138',
        },
      ]).returning();

      await db.insert(schema.petVeterinarians).values([
        { petId: pets[0].id, veterinarianId: vets[0].id },
        { petId: pets[0].id, veterinarianId: vets[1].id },
      ]);

      const result = await VeterinariansService.getPetVeterinarians(pets[0].id, primary.id);

      expect(result).toHaveLength(2);
      expect(result.map(v => v.vetName)).toContain('Dr. First');
      expect(result.map(v => v.vetName)).toContain('Dr. Second');
    });

    it('should return empty array when no veterinarians assigned', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);

      const result = await VeterinariansService.getPetVeterinarians(pets[0].id, primary.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should only return active veterinarians', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      const vets = await db.insert(schema.veterinarians).values([
        {
          userId: primary.id,
          vetName: 'Dr. Active',
          phone: '555-1111',
          addressLine1: '123 Active St',
          city: 'Boston',
          zipCode: '02101',
          isActive: true,
        },
        {
          userId: primary.id,
          vetName: 'Dr. Inactive',
          phone: '555-2222',
          addressLine1: '456 Inactive St',
          city: 'Cambridge',
          zipCode: '02138',
          isActive: false,
        },
      ]).returning();

      await db.insert(schema.petVeterinarians).values([
        { petId: pets[0].id, veterinarianId: vets[0].id },
        { petId: pets[0].id, veterinarianId: vets[1].id },
      ]);

      const result = await VeterinariansService.getPetVeterinarians(pets[0].id, primary.id);

      expect(result).toHaveLength(1);
      expect(result[0].vetName).toBe('Dr. Active');
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const nonExistentId = randomUUID();

      await expect(
        VeterinariansService.getPetVeterinarians(nonExistentId, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const otherUserPets = await DatabaseTestUtils.createTestPets(secondary.id, 1);

      await expect(
        VeterinariansService.getPetVeterinarians(otherUserPets[0].id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getVetsForPet', () => {
    it('should return veterinarians assigned to pet', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      const vets = await db.insert(schema.veterinarians).values([
        {
          userId: primary.id,
          vetName: 'Dr. One',
          phone: '555-0001',
          addressLine1: '111 First St',
          city: 'Boston',
          zipCode: '02101',
        },
        {
          userId: primary.id,
          vetName: 'Dr. Two',
          phone: '555-0002',
          addressLine1: '222 Second St',
          city: 'Cambridge',
          zipCode: '02138',
        },
      ]).returning();

      await db.insert(schema.petVeterinarians).values([
        { petId: pets[0].id, veterinarianId: vets[0].id },
        { petId: pets[0].id, veterinarianId: vets[1].id },
      ]);

      const result = await VeterinariansService.getVetsForPet(pets[0].id, primary.id);

      expect(result).toHaveLength(2);
      expect(result.map(v => v.vetName)).toContain('Dr. One');
      expect(result.map(v => v.vetName)).toContain('Dr. Two');
    });

    it('should return empty array when no veterinarians assigned', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);

      const result = await VeterinariansService.getVetsForPet(pets[0].id, primary.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should only return veterinarians belonging to user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      // Create vet belonging to primary user
      const [primaryVet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'My Vet',
        phone: '555-1111',
        addressLine1: '111 My St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      // Create vet belonging to secondary user
      const [secondaryVet] = await db.insert(schema.veterinarians).values({
        userId: secondary.id,
        vetName: 'Other Vet',
        phone: '555-2222',
        addressLine1: '222 Other St',
        city: 'Cambridge',
        zipCode: '02138',
      }).returning();

      // Assign both vets to primary user's pet (shouldn't happen in practice, but testing)
      await db.insert(schema.petVeterinarians).values([
        { petId: pets[0].id, veterinarianId: primaryVet.id },
        { petId: pets[0].id, veterinarianId: secondaryVet.id },
      ]);

      const result = await VeterinariansService.getVetsForPet(pets[0].id, primary.id);

      // Should only return vets belonging to primary user
      expect(result).toHaveLength(1);
      expect(result[0].vetName).toBe('My Vet');
      expect(result[0].userId).toBe(primary.id);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent operations on the same veterinarian', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Concurrent Vet',
        phone: '555-0000',
        addressLine1: '000 Concurrent St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      const updatePromises = [
        VeterinariansService.updateVeterinarian(vet.id, primary.id, { vetName: 'Updated Name 1' }),
        VeterinariansService.updateVeterinarian(vet.id, primary.id, { clinicName: 'Updated Clinic' }),
      ];

      const results = await Promise.all(updatePromises);

      results.forEach(result => {
        expect(result.id).toBe(vet.id);
      });
    });

    it('should handle very long strings within limits', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const longName = 'A'.repeat(100);
      const longClinic = 'B'.repeat(100);
      const longPhone = '1'.repeat(20);
      const longEmail = 'a'.repeat(88) + '@example.com'; // 100 chars
      const longWebsite = 'https://' + 'w'.repeat(85) + '.com'; // 100 chars
      const longNotes = 'N'.repeat(100);

      const newVetData: NewVeterinarian = {
        userId: primary.id,
        vetName: longName,
        clinicName: longClinic,
        phone: longPhone,
        email: longEmail,
        website: longWebsite,
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
        notes: longNotes,
      };

      const result = await VeterinariansService.createVeterinarian(newVetData);

      expect(result.vetName).toBe(longName);
      expect(result.clinicName).toBe(longClinic);
      expect(result.phone).toBe(longPhone);
      expect(result.notes).toBe(longNotes);
    });

    it('should preserve data types correctly', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newVetData: NewVeterinarian = {
        userId: primary.id,
        vetName: 'Type Test Vet',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
        isActive: true,
      };

      const result = await VeterinariansService.createVeterinarian(newVetData);

      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(typeof result.vetName).toBe('string');
      expect(typeof result.phone).toBe('string');
    });

    it('should handle special characters in text fields', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newVetData: NewVeterinarian = {
        userId: primary.id,
        vetName: "Dr. O'Brien & Associates™",
        clinicName: 'Pets R Us © 2024',
        phone: '+1 (555) 123-4567',
        email: 'test+tag@example.com',
        website: 'https://www.vet-clinic.com',
        addressLine1: '123 Main St. #456',
        addressLine2: 'Bldg. A, Unit 2-B',
        city: 'São Paulo',
        zipCode: '12345-678',
        notes: 'Special: àáâãäå æç èéêë ìíîï',
      };

      const result = await VeterinariansService.createVeterinarian(newVetData);

      expect(result.vetName).toBe("Dr. O'Brien & Associates™");
      expect(result.clinicName).toBe('Pets R Us © 2024');
      expect(result.phone).toBe('+1 (555) 123-4567');
      expect(result.addressLine2).toBe('Bldg. A, Unit 2-B');
      expect(result.notes).toBe('Special: àáâãäå æç èéêë ìíîï');
    });

    it('should handle email edge cases', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      const validEmails = [
        'simple@example.com',
        'very.common@example.com',
        'user+tag@example.co.uk',
        'x@example.com', // Single character local part
        'test.email.with+symbol@example4u.net',
      ];

      for (const email of validEmails) {
        const vetData: NewVeterinarian = {
          userId: primary.id,
          vetName: `Dr. ${email}`,
          phone: '555-1234',
          email: email,
          addressLine1: '123 Main St',
          city: 'Boston',
          zipCode: '02101',
        };

        const result = await VeterinariansService.createVeterinarian(vetData);
        expect(result.email).toBe(email);
      }
    });

    it('should reject invalid email formats', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      const invalidEmails = [
        'plainaddress',
        '@missinglocal.com',
        'missing@domain',
        'two@@example.com',
        'spaces in@example.com',
      ];

      for (const email of invalidEmails) {
        const vetData: NewVeterinarian = {
          userId: primary.id,
          vetName: 'Dr. Test',
          phone: '555-1234',
          email: email,
          addressLine1: '123 Main St',
          city: 'Boston',
          zipCode: '02101',
        };

        await expect(
          VeterinariansService.createVeterinarian(vetData)
        ).rejects.toThrow(BadRequestError);
      }
    });

    it('should handle website edge cases', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      const validWebsites = [
        'www.example.com',
        'example.com',
        'subdomain.example.com',
        'https://example.com',
        'http://www.example.com',
        'example.co.uk',
        'my-site.example.com',
      ];

      for (const website of validWebsites) {
        const vetData: NewVeterinarian = {
          userId: primary.id,
          vetName: `Dr. ${website}`,
          phone: '555-1234',
          website: website,
          addressLine1: '123 Main St',
          city: 'Boston',
          zipCode: '02101',
        };

        const result = await VeterinariansService.createVeterinarian(vetData);
        expect(result.website).toBe(website);
      }
    });

    it('should handle multiple pets with same veterinarian efficiently', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 5);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Busy',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      const petIds = pets.map(p => p.id);
      await VeterinariansService.assignVetToPets(vet.id, primary.id, petIds);

      const assignments = await db.select()
        .from(schema.petVeterinarians)
        .where(eq(schema.petVeterinarians.veterinarianId, vet.id));

      expect(assignments).toHaveLength(5);
    });

    it('should handle deletion of veterinarian with many pet assignments', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const pets = await DatabaseTestUtils.createTestPets(primary.id, 10);
      const [vet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Many Pets',
        phone: '555-1234',
        addressLine1: '123 Main St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      // Assign to all pets
      const petIds = pets.map(p => p.id);
      await VeterinariansService.assignVetToPets(vet.id, primary.id, petIds);

      // Delete vet
      await VeterinariansService.deleteVeterinarian(vet.id, primary.id);

      // Verify all assignments removed
      const assignments = await db.select()
        .from(schema.petVeterinarians)
        .where(eq(schema.petVeterinarians.veterinarianId, vet.id));

      expect(assignments).toHaveLength(0);
    });
  });
});