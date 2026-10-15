import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { TEST_ENV } from './test/shared/env';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// El alias @/ de tsconfig.json, declarado de forma explicita: no depender de la
// resolucion nativa de paths, que no esta disponible en todas las versiones de Vite.
const alias = { '@': path.resolve(projectRoot, 'src') };

/**
 * Cuatro tipos de test, cuatro proyectos.
 *
 * - unit        puros, sin IO ni base de datos. Deben correr en milisegundos.
 * - integration app real + HTTP + base de datos real. Verifica el cableado.
 * - functional  reglas de negocio de punta a punta por caso de uso, con los
 *               servicios externos (Google, Resend) stubbeados.
 * - e2e         el sistema desplegado en Docker, alcanzado como un cliente mas.
 *
 * Cada tipo tiene su directorio propio en `test/`, segun S2.
 */
export default defineConfig({
  resolve: {
    alias,
  },
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          env: TEST_ENV,
          // El alias @/ sale de los paths del tsconfig. Hay que declararlo en cada
          // project: las opciones de `resolve` no se heredan desde la raiz.
          resolve: { tsconfigPaths: true },
          root: '.',
          include: ['test/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          env: TEST_ENV,
          // El alias @/ sale de los paths del tsconfig. Hay que declararlo en cada
          // project: las opciones de `resolve` no se heredan desde la raiz.
          resolve: { tsconfigPaths: true },
          root: '.',
          include: ['test/integration/**/*.test.ts'],
          setupFiles: ['test/setup/integration.setup.ts'],
          // Las pruebas de integracion comparten una base de datos: corren en serie.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
      {
        test: {
          name: 'functional',
          environment: 'node',
          env: TEST_ENV,
          // El alias @/ sale de los paths del tsconfig. Hay que declararlo en cada
          // project: las opciones de `resolve` no se heredan desde la raiz.
          resolve: { tsconfigPaths: true },
          root: '.',
          include: ['test/functional/**/*.test.ts'],
          setupFiles: ['test/setup/functional.setup.ts'],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
      {
        test: {
          name: 'e2e',
          environment: 'node',
          env: TEST_ENV,
          // El alias @/ sale de los paths del tsconfig. Hay que declararlo en cada
          // project: las opciones de `resolve` no se heredan desde la raiz.
          resolve: { tsconfigPaths: true },
          root: '.',
          include: ['test/e2e/**/*.test.ts'],
          setupFiles: ['test/setup/e2e.setup.ts'],
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
