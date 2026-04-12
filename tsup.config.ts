import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  minify: false,
  bundle: true,
  sourcemap: false,
  dts: false,
  banner: { js: '#!/usr/bin/env node' },
});
