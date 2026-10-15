import { TEST_ENV } from '../shared/env';

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/**
 * ¿Hay un stack escuchando?
 *
 * El resultado se guarda en el módulo para que los archivos de prueba puedan
 * declarar `describe.skipIf(...)`. Una comprobación dentro de cada test que
 * solo hace `return` cuando el stack no está arriba produce una suite EN VERDE
 * que no probó nada: es peor que no tener pruebas, porque parece cobertura.
 */
export let isStackAvailable = false;

export const detectStack = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${E2E_BASE_URL}/api/v1/health`, {
      signal: AbortSignal.timeout(2_000),
    });

    return response.status === 200;
  } catch {
    return false;
  }
};

export const initStackCheck = async (): Promise<void> => {
  isStackAvailable = await detectStack();

  if (!isStackAvailable) {
    console.warn(
      `\n[e2e] OMITIDA: no hay stack escuchando en ${E2E_BASE_URL}.\n` +
        `      Levantalo con \`pnpm docker:up\` antes de correr estas pruebas.\n` +
        `      Los tests se marcan como omitidos, NO comoapproved.\n`,
    );
  }
};

export { TEST_ENV };
