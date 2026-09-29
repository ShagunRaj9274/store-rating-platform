import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, /api calls are proxied to the Express server,
    // so no CORS setup or VITE_API_URL is needed locally.
    proxy: { '/api': 'http://localhost:5000' },
  },
});
