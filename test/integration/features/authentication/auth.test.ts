import { createApp } from '@/core/app';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const app = createApp();

const usuarioValido = {
  username: 'juan',
  email: 'juan@example.com',
  password: 'Password1!',
};

describe('POST /api/v1/auth/register', () => {
  it('registra un usuario y devuelve un token', async () => {
    const response = await request(app).post('/api/v1/auth/register').send(usuarioValido);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data).toBe('string');
  });

  it('rechaza un email invalido con 400 antes de tocar la base de datos', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...usuarioValido, email: 'no-es-un-email' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('rechaza una contrasena mas corta de 6 caracteres', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...usuarioValido, password: 'Aa1!' });

    expect(response.status).toBe(400);
  });

  /**
   * COMPORTAMIENTO ACTUAL, NO EL DESEADO.
   *
   * El schema de Zod acepta hasta 12 caracteres, pero `validateCharacters` de
   * PasswordHelpers exige las cuatro categorias y llega hasta 14. Hay dos
   * fuentes de verdad para "que es una contrasena valida" y no coinciden.
   */
  it('acepta por schema una contrasena que el hook de mongoose rechaza', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...usuarioValido, password: 'abcdefghij' });

    // El schema pasa (10 caracteres), el pre-save de mongoose lo rechaza.
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('devuelve un token cuando las credenciales son correctas', async () => {
    await request(app).post('/api/v1/auth/register').send(usuarioValido);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuarioValido.email, password: usuarioValido.password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data).toBe('string');
  });

  it('responde 404 cuando el usuario no existe', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nadie@example.com', password: 'Password1!' });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('User not found');
  });

  it('responde 403 cuando la contrasena no coincide', async () => {
    await request(app).post('/api/v1/auth/register').send(usuarioValido);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuarioValido.email, password: 'OtraClave1!' });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Password incorrect');
  });
});

describe('proteccion de rutas privadas', () => {
  it('rechaza una peticion sin token con 401', async () => {
    const response = await request(app).get('/api/v1/user/profile');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('rechaza un token invalido con 401', async () => {
    const response = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', 'Bearer token-inventado');

    expect(response.status).toBe(401);
  });
});
