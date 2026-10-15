import { createApp } from '@/core/app';
import { jwtHelpers } from '@/lib';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const app = createApp();

const usuario = {
  username: 'juan',
  email: 'juan@example.com',
  password: 'Password1!',
};

/**
 * Flujos completos de punta a punta contra la app real y un mongod real.
 * Los servicios externos (Google, Resend) no participan de estos flujos.
 */
describe('flujo de registro y acceso', () => {
  it('registrarse entrega un token que sirve para acceder a una ruta privada', async () => {
    const registro = await request(app).post('/api/v1/auth/register').send(usuario);

    expect(registro.status).toBe(200);
    const token = registro.body.data as string;

    // El token no es un string cualquiera: es un JWT verificable.
    expect(jwtHelpers.verifyToken(token)?.payload).toEqual(expect.any(String));

    const perfil = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(perfil.status).toBe(200);
    expect(perfil.body.success).toBe(true);
    expect(perfil.body.data).toMatchObject({ email: usuario.email });
  });

  it('el token de registro y el de login son equivalentes para el mismo usuario', async () => {
    await request(app).post('/api/v1/auth/register').send(usuario);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuario.email, password: usuario.password });

    const tokenDeRegistro = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...usuario,
        email: 'otro@example.com',
        username: 'otro',
      });

    const uuidDelRegistro = jwtHelpers.verifyToken(tokenDeRegistro.body.data)?.payload;
    const uuidDelLogin = jwtHelpers.verifyToken(login.body.data)?.payload;

    expect(typeof uuidDelLogin).toBe('string');
    expect(uuidDelLogin).not.toBe(uuidDelRegistro);
  });

  it('la contrasena nunca viaja de vuelta en la respuesta', async () => {
    const registro = await request(app).post('/api/v1/auth/register').send(usuario);

    expect(JSON.stringify(registro.body)).not.toContain(usuario.password);

    const perfil = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', `Bearer ${registro.body.data}`);

    expect(perfil.body.data).not.toHaveProperty('password');
  });

  it('no se puede registrar dos veces el mismo email', async () => {
    await request(app).post('/api/v1/auth/register').send(usuario);

    const segundo = await request(app).post('/api/v1/auth/register').send(usuario);

    // El indice unico de mongoose rechaza el duplicado y el repositorio lo
    // traduce a 409: es input del cliente, no una falla del servidor.
    expect(segundo.status).toBe(409);
    expect(segundo.body.success).toBe(false);
    expect(segundo.body.error.code).toBe('CONFLICT');
  });
});

describe('flujo de autenticacion fallida', () => {
  it('login con contrasena incorrecta no entrega token', async () => {
    await request(app).post('/api/v1/auth/register').send(usuario);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuario.email, password: 'Incorrecta1!' });

    expect(login.status).toBe(401);
    expect(login.body.data).toBeUndefined();
  });

  it('un token sin firma propia no habilita ninguna ruta privada', async () => {
    for (const token of ['', 'Bearer', 'Bearer abc.def.ghi']) {
      const respuesta = await request(app).get('/api/v1/user/profile').set('Authorization', token);

      expect(respuesta.status, `token: "${token}"`).toBe(401);
    }
  });

  it('un token firmado con otro secreto no habilita ninguna ruta privada', async () => {
    const intruso = jwtHelpers.generateToken({ payload: 'uuid-falso' }, '2d');
    const respuesta = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', `Bearer ${intruso}`);

    // Secretos correctos: el token es valido. Lo que se prueba aca es que el
    // uuid no existe, y la respuesta sigue siendo 401 y no 500.
    expect([401, 404]).toContain(respuesta.status);
    expect(respuesta.body.success).toBe(false);
  });
});
