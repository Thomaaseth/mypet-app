import { beforeEach } from 'vitest';
import { DatabaseTestUtils } from './database-test-utils';

/**
 * Global test setup - runs before each test
 * ensures every test starts with a clean database state
 */
beforeEach(async () => {
  // Clean database before each test to ensure isolation
  await DatabaseTestUtils.cleanDatabase();
});