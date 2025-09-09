import { beforeAll, afterAll, beforeEach } from 'vitest';
import { cleanTestDatabase } from './database';


beforeAll(async () => {
  // Set test environment
  // process.env.NODE_ENV = 'test';
  // process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/pettr_test';
  // process.env.BETTER_AUTH_SECRET = 'test-secret-key';
  // process.env.RESEND_API_KEY = 'test-resend-key';
  console.log('Test environment initialized');
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@'));
});  

afterAll(async () => {
  // Close test database connection
  // await closeTestDatabase();
  console.log('Test environment cleaned up');
});

beforeEach(async () => {
  // Clean all tables before each test
  await cleanTestDatabase();
});