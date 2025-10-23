import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';

// Automatically unmount and cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Start MSW server before all tests
beforeAll(() => {

  console.log('🟢 Starting MSW server...');

  server.listen({ 
    onUnhandledRequest: 'warn' // Warn about unmocked requests
  });

  console.log('🟢 MSW server started');

});

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});


const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});