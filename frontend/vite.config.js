import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Disable buffering for SSE streaming
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              // Disable compression which causes buffering
              delete proxyRes.headers['content-encoding'];
              proxyRes.headers['cache-control'] = 'no-cache';
              proxyRes.headers['x-accel-buffering'] = 'no';
              // Flush each chunk immediately to the client
              proxyRes.on('data', (chunk) => {
                res.write(chunk);
                if (typeof res.flush === 'function') res.flush();
              });
            }
          });
        },
      },
    },
  },
})
