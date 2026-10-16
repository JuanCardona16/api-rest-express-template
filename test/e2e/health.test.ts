import { E2E_BASE_URL, isStackAvailable } from '../shared/stack';
import { describe, expect, it } from 'vitest';

/**
 * Sondas de salud contra el stack REAL.
 *
 * Esto prueba la cadena entera y no un handler suelto: peticion -> nginx ->
 * API -> Mongo. Si `ready` devolviera 200 sin base, esta prueba no lo veria,
 * porque aqui la base esta de verdad levantada. Lo que si atrapa es que nginx
 * no enrute, que la API no llegue a tiempo, o que la sonda se monte despues del
 * limitador y la cuota del healthcheck se coma el contenedor.
 */
describe.skipIf(!isStackAvailable)('sondas de salud contra el stack desplegado', () => {
  it('liveness responde 200 atravesando nginx', async () => {
    const response = await fetch(`${E2E_BASE_URL}/api/v1/health/live`);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { status: string } };
    expect(body.data.status).toBe('alive');
  });

  it('readiness responde 200 con la base de datos arriba', async () => {
    const response = await fetch(`${E2E_BASE_URL}/api/v1/health/ready`);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { status: string; database: string } };
    expect(body.data.status).toBe('ready');
    expect(body.data.database).toBe('connected');
  });

  it('la version antigua sigue respondiendo 200', async () => {
    // El job `build` de CI depende de esto: consulta `/health` con una
    // DATABASE_URL invalida y espera 200.
    const response = await fetch(`${E2E_BASE_URL}/api/v1/health`);

    expect(response.status).toBe(200);
  });

  it('el healthcheck no consume la cuota del limitador', async () => {
    // Con RATE_LIMIT_MAX chico en el entorno, 50 sondas seguidas no pueden caer
    // en 429: estan montadas antes del limiter.
    const respuestas = await Promise.all(
      Array.from({ length: 50 }, () => fetch(`${E2E_BASE_URL}/api/v1/health/ready`)),
    );

    expect(respuestas.every((r) => r.status === 200)).toBe(true);
  });

  it('nginx responde con su propia cabecera Server', async () => {
    // Prueba que la peticion cruzo el proxy y no esta pegando al contenedor de
    // la API directo, que es lo que haria que el balanceo no se pueda observar.
    const response = await fetch(`${E2E_BASE_URL}/api/v1/health/live`);

    expect(response.headers.get('server')).toContain('nginx');
  });
});
