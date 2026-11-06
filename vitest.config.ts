import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    // Native DuckDB workers are memory-heavy on Windows. Bound parallelism
    // instead of letting the host CPU count cause timeouts/resource exhaustion.
    maxWorkers: process.platform === 'win32' ? 2 : undefined,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'lib/',
        'esm/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
