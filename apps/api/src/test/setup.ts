import { beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, cleanTestDatabase, closeTestDatabase } from './database';


beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/pettr_test';
  process.env.BETTER_AUTH_SECRET = 'test-secret-key';
  process.env.RESEND_API_KEY = 'test-resend-key';
  console.log('Test database connected');
});  

afterAll(async () => {
  // Close test database connection
  await closeTestDatabase();
  console.log('Test database disconnected');
});

beforeEach(async () => {
  // Clean all tables before each test
  await cleanTestDatabase();
});