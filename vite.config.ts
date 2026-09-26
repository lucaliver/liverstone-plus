import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  base: './',
  build: { target: 'es2022', assetsInlineLimit: 0 },
  define: { __APP_VERSION__: JSON.stringify(version) },
  test: { environment: 'node' },
} as never);
