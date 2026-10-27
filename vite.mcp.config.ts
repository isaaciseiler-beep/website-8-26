import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  publicDir: false,
  build: { outDir: '.mcp-build', emptyOutDir: true, rollupOptions: { input: 'mcp-app.html' } },
});
