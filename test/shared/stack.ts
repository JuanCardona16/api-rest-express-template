import { TEST_ENV } from '../shared/env';

/**
 * Las pruebas de extremo a extremo corren contra el sistema ya desplegado,
 * no contra el codigo de este checkout.
 *
 * Si el stack no esta arriba no se simula un exito: se salta la suite y se
 * dice por que. Un E2E verde sin haber probado nada es peor que uno ausente.
 */
export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export const isStackRunning = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${E2E_BASE_URL}/api/v1/not-a-real-route`, {
      signal: AbortSignal.timeout(2_000),
    });
    // Cualquier respuesta HTTP prueba que hay algo escuchando en ese puerto.
    return response.status > 0;
  } catch {
    return false;
  }
};

export const skipUnlessStackIsRunning = async (): Promise<boolean> => {
  const running = await isStackRunning();

  if (!running) {
    console.warn(
      `\n[e2e] Omitido: no hay stack escuchando en ${E2E_BASE_URL}.\n` +
        `      Levantalo con \`pnpm docker:prod\` antes de correr las pruebas de extremo a extremo.\n`,
    );
  }

  return running;
};

export { TEST_ENV };
