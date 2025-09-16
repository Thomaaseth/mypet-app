import { DatabaseTestUtils } from '../../../../test/database-test-utils';

export async function setupUserAndPet() {
  const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
  const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
  return { primary, secondary, testPet };
}
