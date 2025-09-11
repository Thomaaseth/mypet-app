import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],

    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 1, // Force sequential execution for database tests
        minThreads: 1,
      },
    },
    
    // Setup file to clean database before each test
    setupFiles: ['./src/test/setup.ts'],
    
    // Test timeout - increase if needed for database operations
    testTimeout: 30000, // 30 seconds
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/db/migrations/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
    // vi available globally
    deps: {
      inline: ['vitest'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});