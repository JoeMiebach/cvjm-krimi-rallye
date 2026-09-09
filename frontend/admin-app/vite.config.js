import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Admin-App: Deployment im Unterordner /admin/ -> base MUSS gesetzt sein,
// sonst zeigen Asset-Pfade im gebauten index.html auf den Domain-Root und
// die App lädt auf STRATO nicht korrekt.
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    port: 5174
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
