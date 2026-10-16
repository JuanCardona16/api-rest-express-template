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
  // Dos entrypoints, no uno. El segundo es el SDK de OpenTelemetry, que tiene que
  // evaluarse ANTES que el grafo de la aplicacion para que los hooks de
  // instrumentacion alcancen a `express`, `mongoose` e `ioredis`. El arranque
  // lo carga con `node --import ./dist/telemetry.js dist/index.js`.
  // La forma de objeto es la que permite nombrar la salida `telemetry.js`; con
  // un array, tsup la derivaria del basename y saldria `register.js`.
  entry: {
    index: 'src/core/index.ts',
    telemetry: 'src/infrastructure/telemetry/register.ts',
  },
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

    // Sin esto, la minificacion renombra los middlewares de express a `Ae`, `Xe`,
    // `Qe`... y las trazas de OpenTelemetry salen con `middleware - Ae` en lugar
    // del nombre real. Un trace que no se puede leer no sirve para diagnosing.
    options.keepNames = true;
  },
});
