import { createApp } from '@/core/app';
import { InMemoryCodeSecurityService } from '@/features/authentication/helpers/InMemoryCodeSecurityService';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

const app = createApp();

const usuario = {
  username: 'juan',
  email: 'juan@example.com',
  password: 'Password1!',
};

/**
 * Flujos de recuperacion de contrasena y login de Google.
 *
 * El cliente de email se inyecta como puerto y los tests usan un doble, asi que
 * ningun correo sale de la maquina. El codigo de verificacion se lee del helper
 * de codigos, que es la unica fuente de verdad en el proceso.
 */
describe('recuperacion de contrasena', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(usuario);
  });

  it('envia un codice de verificacion a un usuario existente', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: usuario.email });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('rechaza con 400 un email invalido', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'no-es-un-email' });

    expect(response.status).toBe(400);
  });

  it('no revela si el email esta registrado', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nadie@example.com' });

    // Mismo status y mismo cuerpo que el caso de un email existente: el endpoint
    // no puede convertirse en un oraculo de "¿quien tiene cuenta aqui?".
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: 'If the email exists, a code has been sent',
      status: 200,
      timestamp: expect.any(String),
    });
  });

  it('rechaza con 400 un codigo incorrecto', async () => {
    await request(app).post('/api/v1/auth/forgot-password').send({ email: usuario.email });

    const response = await request(app)
      .post('/api/v1/auth/verify-code')
      .send({ email: usuario.email, code: '000000' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CODE');
  });

  it('cambia la contrasena con un codigo valido y permite entrar con la nueva', async () => {
    await request(app).post('/api/v1/auth/forgot-password').send({ email: usuario.email });

    const codigo = InMemoryCodeSecurityService.getCodeForTesting(usuario.email);

    const verificado = await request(app)
      .post('/api/v1/auth/verify-code')
      .send({ email: usuario.email, code: codigo });

    expect(verificado.status).toBe(200);
    expect(verificado.body.data.token).toEqual(expect.any(String));

    const nueva = 'NuevaClave1!';

    const cambiado = await request(app)
      .post('/api/v1/auth/change-password')
      .send({ email: usuario.email, token: verificado.body.data.token, newPassword: nueva });

    expect(cambiado.status).toBe(200);

    // La contrasena nueva sirve y la vieja deja de servir.
    const conNueva = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuario.email, password: nueva });
    expect(conNueva.status).toBe(200);

    const conVieja = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuario.email, password: usuario.password });
    expect(conVieja.status).toBe(401);
  });

  it('rechaza el cambio con una contrasena que no cumple la regla', async () => {
    await request(app).post('/api/v1/auth/forgot-password').send({ email: usuario.email });
    const codigo = InMemoryCodeSecurityService.getCodeForTesting(usuario.email);
    const verificado = await request(app)
      .post('/api/v1/auth/verify-code')
      .send({ email: usuario.email, code: codigo });

    const response = await request(app)
      .post('/api/v1/auth/change-password')
      .send({ email: usuario.email, token: verificado.body.data.token, newPassword: 'debil' });

    expect(response.status).toBe(400);
  });

  it('un codigo se consume una sola vez', async () => {
    await request(app).post('/api/v1/auth/forgot-password').send({ email: usuario.email });
    const codigo = InMemoryCodeSecurityService.getCodeForTesting(usuario.email);

    const primero = await request(app)
      .post('/api/v1/auth/verify-code')
      .send({ email: usuario.email, code: codigo });
    expect(primero.status).toBe(200);

    const segundo = await request(app)
      .post('/api/v1/auth/verify-code')
      .send({ email: usuario.email, code: codigo });
    expect(segundo.status).toBe(400);
  });

  it('el codigo de un email no sirve para otro', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ ...usuario, email: 'otro@example.com', username: 'otro' });

    await request(app).post('/api/v1/auth/forgot-password').send({ email: 'otro@example.com' });
    const codigoDeOtro = InMemoryCodeSecurityService.getCodeForTesting('otro@example.com');

    const response = await request(app)
      .post('/api/v1/auth/verify-code')
      .send({ email: usuario.email, code: codigoDeOtro });

    expect(response.status).toBe(400);
  });
});

describe('login con Google', () => {
  it('rechaza con 400 un body vacio', async () => {
    const response = await request(app).post('/api/v1/auth/google').send({});

    expect(response.status).toBe(400);
  });

  it('rechaza con 401 un codigo que Google no reconoce', async () => {
    const response = await request(app)
      .post('/api/v1/auth/google')
      .send({ code: 'un-codigo-que-google-no-emitio' });

    expect(response.status).toBe(401);
  });
});
