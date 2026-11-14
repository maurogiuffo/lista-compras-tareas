import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, las llamadas a /api se redirigen a la API local.
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:3000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
});
