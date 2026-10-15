import { createApp } from '@/core/app';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const app = createApp();

const registrarYAutenticar = async (overrides = {}) => {
  const usuario = {
    username: 'juan',
    email: 'juan@example.com',
    password: 'Password1!',
    ...overrides,
  };

  const registro = await request(app).post('/api/v1/auth/register').send(usuario);

  return {
    usuario,
    token: registro.body.data as string,
    comoUsuario: (req: request.Test) => req.set('Authorization', `Bearer ${registro.body.data}`),
  };
};

describe('gestion de usuarios por HTTP', () => {
  it('el perfil devuelve el usuario autenticado', async () => {
    const { usuario, comoUsuario } = await registrarYAutenticar();

    const perfil = await comoUsuario(request(app).get('/api/v1/user/profile'));

    expect(perfil.status).toBe(200);
    expect(perfil.body.data).toMatchObject({ email: usuario.email, username: usuario.username });
  });

  it('busca por email entre los usuarios autenticados', async () => {
    const { usuario, comoUsuario } = await registrarYAutenticar();

    const encontrado = await comoUsuario(request(app).get(`/api/v1/user/${usuario.email}`));

    expect(encontrado.status).toBe(200);
    expect(encontrado.body.data).toMatchObject({ email: usuario.email });
  });

  it('actualiza el usuario y el cambio queda persistido', async () => {
    const { token, comoUsuario } = await registrarYAutenticar();
    const { jwtHelpers } = await import('@/lib');
    const uuid = jwtHelpers.verifyToken(token)?.payload as string;

    const actualizado = await comoUsuario(
      request(app)
        .put(`/api/v1/user/${uuid}`)
        .send({ user: { username: 'juan Carlos' } }),
    );

    expect(actualizado.status).toBe(200);
    expect(actualizado.body.data).toMatchObject({ username: 'juan Carlos' });

    const perfil = await comoUsuario(request(app).get('/api/v1/user/profile'));
    expect(perfil.body.data).toMatchObject({ username: 'juan Carlos' });
  });

  it('borra el usuario y deja de estar disponible', async () => {
    const { token, comoUsuario } = await registrarYAutenticar();
    const { jwtHelpers } = await import('@/lib');
    const uuid = jwtHelpers.verifyToken(token)?.payload as string;

    const borrado = await comoUsuario(request(app).delete(`/api/v1/user/${uuid}`));
    expect(borrado.status).toBe(200);

    const despues = await comoUsuario(request(app).get('/api/v1/user/profile'));
    expect(despues.status).toBe(404);
  });

  it('ninguna operacion de usuarios es posible sin token', async () => {
    await registrarYAutenticar();

    const operaciones = [
      request(app).get('/api/v1/user/profile'),
      request(app).get('/api/v1/user/'),
      request(app).get('/api/v1/user/juan@example.com'),
      request(app).put('/api/v1/user/algo').send({ user: {} }),
      request(app).delete('/api/v1/user/algo'),
    ];

    for (const operacion of operaciones) {
      const respuesta = await operacion;
      expect(respuesta.status).toBe(401);
    }
  });

  it('la lista de usuarios nunca expone contraseñas', async () => {
    const { comoUsuario } = await registrarYAutenticar();

    const lista = await comoUsuario(request(app).get('/api/v1/user/'));

    expect(lista.status).toBe(200);
    expect(lista.body.data).toHaveLength(1);
    expect(lista.body.data[0]).not.toHaveProperty('password');
  });
});
