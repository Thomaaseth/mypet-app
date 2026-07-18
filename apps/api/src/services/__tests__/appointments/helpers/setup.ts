import { DatabaseTestUtils } from '../../../../test/database-test-utils';
import { VeterinariansService } from '../../../veterinarians.service';
import { db } from '../../../../db';
import * as schema from '../../../../db/schema';

export async function setupUserPetAndVet() {
  const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
  const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);

  const [testVet] = await db.insert(schema.veterinarians).values({
    userId: primary.id,
    vetName: 'Dr. Test',
    phone: '555-1234',
    addressLine1: '123 Main St',
    city: 'Boston',
    zipCode: '02101',
  }).returning();

  // Most appointment operations require the vet to be assigned to the pet
  await VeterinariansService.assignVetToPets(testVet.id, primary.id, [testPet.id]);

  return { primary, secondary, testPet, testVet };
}