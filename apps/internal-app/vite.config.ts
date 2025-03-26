import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

console.log(process.env.HOST, process.env.PORT, process.env.DOMAIN);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: process.env.HOST ? process.env.HOST : '0.0.0.0',
    port: process.env.PORT ? Number.parseInt(process.env.PORT) : 5173,
    strictPort: true,
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
    // Allow all hosts to make requests to the dev server
    cors: true,
    // Allow specific hosts (including the proxy)
    fs: {
      strict: false,
    },
    allowedHosts: [
      `.${process.env.DOMAIN}`,
      'localhost',
      'internal-app',
      'agent',
      'streamer',
      'internal-api',
    ],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  define: {
    'import.meta.env.VITE_ADDRESS': JSON.stringify(process.env.ADDRESS),
    'import.meta.env.VITE_RTMP_URL': JSON.stringify(process.env.RTMP_URL),
    'import.meta.env.VITE_AGENT_PORT': JSON.stringify(process.env.AGENT_PORT),
    'import.meta.env.VITE_AGENT_HOST': JSON.stringify(process.env.AGENT_HOST),
    'import.meta.env.VITE_DOMAIN': JSON.stringify(process.env.DOMAIN),
    'import.meta.env.VITE_TARGET_URL': JSON.stringify(process.env.TARGET_URL),
    'import.meta.env.VITE_TARGET_VNC_PORT': JSON.stringify(
      process.env.TARGET_VNC_PORT
    ),
    'import.meta.env.VITE_TARGET_VNC_PATH': JSON.stringify(
      process.env.TARGET_VNC_PATH
    ),
    'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'import.meta.env.VITE_TG_BEARER_TOKEN': JSON.stringify(process.env.NEXT_TG_BEARER_TOKEN),
  },
});
