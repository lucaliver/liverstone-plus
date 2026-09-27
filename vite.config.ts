import { defineConfig } from 'vite';
// Imported (not read from disk) so it counts as a config dependency: bumping the version restarts the dev server.
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base: './',
  build: { target: 'es2022', assetsInlineLimit: 0 },
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as never);
