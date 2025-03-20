import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

console.log(process.env.HOST, process.env.PORT, process.env.DOMAIN);

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.HOST ? process.env.HOST : '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: true,
    // Allow all hosts to make requests to the dev server
    cors: true,
    // Allow specific hosts (including the proxy)
    fs: {
      strict: false,
    },
    allowedHosts: [`.${process.env.DOMAIN}`, 'localhost'],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
}); 