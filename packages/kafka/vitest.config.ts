import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
    // Schematic tests run the compiled collection from dist/ (templates are copied there).
    globalSetup: ['./test/global-setup.ts'],
  },
});
