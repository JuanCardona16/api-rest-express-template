import { E2E_BASE_URL, itConStack } from '../shared/stack';
import { describe, expect } from 'vitest';

const email = `e2e-${Date.now()}@example.com`;

const registrar = async (password = 'Password1!') => {
  const respuesta = await fetch(`${E2E_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'e2e', email, password }),
  });

  return { status: respuesta.status, cuerpo: await respuesta.json() };
};

/**
 * Pruebas de extremo a extremo contra el sistema desplegado en Docker.
 *
 * Aqui no hay mocks, ni base de datos en memoria, ni imports del codigo: se
 * habla con la API por HTTP como lo haria un cliente real. Si pasan, la imagen
 * sirve; si hay que clonar el repo y buildear para pasarlas, la imagen no sirve.
 */
describe('API desplegada en Docker', () => {
  itConStack('responde con 404 y el contrato de error en una ruta inexistente', async () => {
    const respuesta = await fetch(`${E2E_BASE_URL}/api/v1/no-existe`);

    expect(respuesta.status).toBe(404);
    const cuerpo = await respuesta.json();
    expect(cuerpo).toMatchObject({ success: false, status: 404 });
  });

  itConStack('registra un usuario y devuelve un token utilizable', async () => {
    const { status, cuerpo } = await registrar();

    expect(status).toBe(200);
    expect(cuerpo.success).toBe(true);

    const perfil = await fetch(`${E2E_BASE_URL}/api/v1/user/profile`, {
      headers: { Authorization: `Bearer ${cuerpo.data}` },
    });

    expect(perfil.status).toBe(200);
    expect((await perfil.json()).data).toMatchObject({ email });
  });

  itConStack('rechaza una ruta privada sin token', async () => {
    const respuesta = await fetch(`${E2E_BASE_URL}/api/v1/user/profile`);

    expect(respuesta.status).toBe(401);
  });

  itConStack('rechaza una contrasena debil con 400 y no con 500', async () => {
    const { status } = await registrar('abcdefghij');

    expect(status).toBe(400);
  });

  itConStack('no expone la cabecera x-powered-by', async () => {
    const respuesta = await fetch(`${E2E_BASE_URL}/api/v1/no-existe`);

    expect(respuesta.headers.get('x-powered-by')).toBeNull();
  });

  itConStack('sirve la especificacion OpenAPI en /swagger.json', async () => {
    const respuesta = await fetch(`${E2E_BASE_URL}/swagger.json`);

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).openapi).toBe('3.0.0');
  });
});
