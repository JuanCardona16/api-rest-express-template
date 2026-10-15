import { defineConfig } from 'tsup';

/**
 * Build de produccion.
 *
 * tsup envuelve a esbuild y agrega lo que este proyecto necesitaba a mano:
 *
 * - Las dependencias y peerDependencies quedan fuera del bundle por defecto, sin
 *   mantener una lista manual que se desactualiza en cada `pnpm add`. Por eso el
 *   artefacto necesita un `node_modules` de produccion en runtime.
 * - `shims` reemplaza el banner con `createRequire` que antes habia que escribir a
 *   mano para que `__dirname` y `import.meta.url` sobrevivieran a ESM.
 * - El alias `@/` sale de los `paths` del tsconfig, resueltos de forma nativa.
 *   El script de esbuild anterior definia un plugin para eso que solo se activaba
 *   con NODE_ENV=development, y que ademas era redundante: nunca corria en el
 *   build real.
 */
export default defineConfig({
  entry: ['src/core/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  clean: true,
  sourcemap: false,
  minify: true,
  splitting: false,
  shims: true,
  dts: false,
  skipNodeModulesBundle: true,
  esbuildOptions(options) {
    // Un artefacto construido es de produccion por definicion. Sin esto, correr
    // `node dist/index.js` sin NODE_ENV deja Swagger UI habilitado y expone el
    // stack de errores: fallar hacia el lado permisivo.
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': '"production"',
    };
  },
});
