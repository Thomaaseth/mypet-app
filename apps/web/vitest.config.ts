import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom', // Simulates browser environment

    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.vinxi', 'src/routeTree.gen.ts'],

    // Setup files run before each test file
    setupFiles: ['./src/test/setup.ts'],
    
    // Test timeout - shorter for frontend (no DB operations)
    testTimeout: 10000, // 10 seconds
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/routeTree.gen.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'src/components/ui/**', // Skip UI library components
      ],
      // high coverage on business logic
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },

    // Global test utilities available everywhere
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