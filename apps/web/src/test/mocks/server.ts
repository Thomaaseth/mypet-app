import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server with default handlers
console.log('📦 Loading MSW server module');

export const server = setupServer(...handlers);
console.log('📦 MSW server created with', handlers.length, 'handlers');
