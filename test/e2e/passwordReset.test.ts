import { E2E_BASE_URL, isStackAvailable } from '../shared/stack';
import { describe, expect, it } from 'vitest';

const email = `e2e-reset-${Date.now()}@example.com`;

const registrar = async () => {
  const respuesta = await fetch(`${E2E_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'e2e', email, password: 'Password1!' }),
  });

  return { status: respuesta.status, cuerpo: await respuesta.json() };
};

const post = (ruta: string, body: unknown) =>
  fetch(`${E2E_BASE_URL}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

/**
 * Recuperación de contraseña contra la imagen desplegada.
 *
 * El código de verificación se pide por forgot-password y llega por email, así
 * que contra el stack real solo se puede probar el camino que no depende de
 * recibirlo: que los endpoints existen, validan y no filtran información. El
 * flujo completo con código vive en las pruebas funcionales, donde el helper de
 * códigos es accesible sin enviar correo.
 */
describe.skipIf(!isStackAvailable)('recuperación de contraseña desplegada', () => {
  it('el endpoint forgot-password existe y responde', async () => {
    await registrar();

    const respuesta = await post('/api/v1/auth/forgot-password', { email });

    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo.success).toBe(true);
  });

  it('responde lo mismo para un email que no existe', async () => {
    const existente = await post('/api/v1/auth/forgot-password', { email });
    const cuerpoExistente = await existente.json();

    const inexistente = await post('/api/v1/auth/forgot-password', {
      email: `nadie-${Date.now()}@example.com`,
    });
    const cuerpoInexistente = await inexistente.json();

    // Si difirieran, el endpoint seria un oraculo de que correos estan registrados.
    expect(inexistente.status).toBe(existente.status);
    expect(cuerpoInexistente.data).toBe(cuerpoExistente.data);
  });

  it('rechaza un email invalido con 400', async () => {
    const respuesta = await post('/api/v1/auth/forgot-password', { email: 'no-es-un-email' });

    expect(respuesta.status).toBe(400);
  });

  it('rechaza un codigo incorrecto con 400 INVALID_CODE', async () => {
    const respuesta = await post('/api/v1/auth/verify-code', { email, code: '000000' });

    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).error.code).toBe('INVALID_CODE');
  });

  it('rechaza un token de reset invalido con 401', async () => {
    const respuesta = await post('/api/v1/auth/change-password', {
      email,
      token: 'token-inventado',
      newPassword: 'NuevaClave1!',
    });

    expect(respuesta.status).toBe(401);
  });

  it('rechaza una contrasena debil con 400', async () => {
    const respuesta = await post('/api/v1/auth/change-password', {
      email,
      token: 'token-inventado',
      newPassword: 'debil',
    });

    // El orden importa: la regla de contrasena se valida antes que el token.
    expect(respuesta.status).toBe(400);
  });
});

describe.skipIf(!isStackAvailable)('login con Google desplegado', () => {
  it('rechaza un body vacio con 400', async () => {
    const respuesta = await post('/api/v1/auth/google', {});

    expect(respuesta.status).toBe(400);
  });

  it('rechaza un codigo que Google no reconoce con 401', async () => {
    const respuesta = await post('/api/v1/auth/google', { code: 'codigo-falso' });

    expect(respuesta.status).toBe(401);
  });
});

describe.skipIf(!isStackAvailable)('registro desplegado', () => {
  it('un email duplicado responde 409 y no 500', async () => {
    await registrar();

    const segundo = await registrar();

    expect(segundo.status).toBe(409);
    expect(segundo.cuerpo.error.code).toBe('CONFLICT');
  });

  it('el login no distingue usuario inexistente de contrasena incorrecta', async () => {
    await registrar();

    const inexistente = await post('/api/v1/auth/login', {
      email: `nadie-${Date.now()}@example.com`,
      password: 'Password1!',
    });
    const cuerpoInexistente = await inexistente.json();

    const contrasenaIncorrecta = await post('/api/v1/auth/login', {
      email,
      password: 'Incorrecta1!',
    });
    const cuerpoIncorrecta = await contrasenaIncorrecta.json();

    expect(inexistente.status).toBe(contrasenaIncorrecta.status);
    expect(cuerpoInexistente.error).toEqual(cuerpoIncorrecta.error);
  });
});
