import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const diretorioAtual = dirname(fileURLToPath(import.meta.url));
const pacoteRaiz = JSON.parse(readFileSync(resolve(diretorioAtual, '../../package.json'), 'utf8')) as { version: string };

export default defineConfig({
  plugins: [react()],
  define: {
    __MESA_ARCANA_VERSION__: JSON.stringify(pacoteRaiz.version)
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
