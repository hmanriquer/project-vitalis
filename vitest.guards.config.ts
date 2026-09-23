import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'guards',
    include: ['src/**/*.guard.test.ts'],
    environment: 'node',
  },
});
