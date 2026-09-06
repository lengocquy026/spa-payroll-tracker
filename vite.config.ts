import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs work on both GitHub project Pages and a custom domain.
  base: process.env.GITHUB_ACTIONS ? './' : '/',
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
