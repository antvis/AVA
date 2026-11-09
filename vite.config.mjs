import { readFileSync } from 'node:fs';
import { isBuiltin } from 'node:module';

import { defineConfig } from 'vite';

const { dependencies } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// Bundle the emitter's ESM build to avoid its CommonJS default-export interop issue in Node.
const external = Object.keys(dependencies).filter((name) => name !== '@antv/event-emitter');
const sdkEntries = { index: 'src/index.ts', 'index.browser': 'src/index.browser.ts' };

export default defineConfig({
  plugins: [
    {
      name: 'esm-declarations',
      generateBundle() {
        for (const name of Object.keys(sdkEntries)) {
          this.emitFile({
            type: 'asset',
            fileName: `${name}.d.mts`,
            source: `export * from '../lib/${name}.js';\n`,
          });
        }
      },
    },
  ],
  build: {
    target: 'es2017',
    outDir: 'esm',
    minify: false,
    lib: {
      entry: sdkEntries,
      formats: ['es'],
      fileName: (_format, name) => `${name}.mjs`,
    },
    rollupOptions: {
      external: (id) => isBuiltin(id) || external.some((name) => id === name || id.startsWith(`${name}/`)),
    },
  },
});
