import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['node_modules', 'references', '.next'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
