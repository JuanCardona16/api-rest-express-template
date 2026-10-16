import UserServices from '@/features/user/services/user.service';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  comoRepositorio,
  crearRepositorioDeUsuariosMock,
  RepositorioDeUsuariosMock,
  usuarioDePrueba,
} from '../../../shared/userRepositoryMock';

describe('UserServices', () => {
  let repositorio: RepositorioDeUsuariosMock;
  let servicio: UserServices;

  beforeEach(() => {
    repositorio = crearRepositorioDeUsuariosMock();
    servicio = new UserServices(comoRepositorio(repositorio));
  });

  describe('getUserByUuid', () => {
    it('devuelve el usuario encontrado', async () => {
      const usuario = usuarioDePrueba();
      repositorio.getUserByUuid.mockResolvedValue(usuario);

      const respuesta = await servicio.getUserByUuid(usuario.uuid);

      expect(respuesta.success).toBe(true);
      expect(respuesta.data).toEqual(usuario);
      expect(repositorio.getUserByUuid).toHaveBeenCalledWith(usuario.uuid);
    });

    it('lanza 404 cuando el usuario no existe', async () => {
      repositorio.getUserByUuid.mockResolvedValue(null);

      await expect(servicio.getUserByUuid('uuid-inexistente')).rejects.toMatchObject({
        status: 404,
        message: 'User not found',
      });
    });

    it('lanza 400 antes de consultar cuando no llega uuid', async () => {
      await expect(servicio.getUserByUuid('')).rejects.toMatchObject({ status: 400 });
      expect(repositorio.getUserByUuid).not.toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    it('devuelve el usuario encontrado', async () => {
      repositorio.getUserByEmail.mockResolvedValue(usuarioDePrueba());

      const respuesta = await servicio.getUserByEmail('juan@example.com');

      expect(respuesta.data).toMatchObject({ email: 'juan@example.com' });
    });

    it('lanza 404 cuando el email no existe', async () => {
      repositorio.getUserByEmail.mockResolvedValue(null);

      await expect(servicio.getUserByEmail('nadie@example.com')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('lanza 400 antes de consultar cuando no llega email', async () => {
      await expect(servicio.getUserByEmail('')).rejects.toMatchObject({ status: 400 });
      expect(repositorio.getUserByEmail).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('devuelve el usuario actualizado', async () => {
      const actualizado = usuarioDePrueba({ username: 'juan Carlos' });
      repositorio.updateUser.mockResolvedValue(actualizado);

      const respuesta = await servicio.updateUser(actualizado.uuid, { username: 'juan Carlos' });

      expect(respuesta.data).toEqual(actualizado);
      expect(repositorio.updateUser).toHaveBeenCalledWith(actualizado.uuid, {
        username: 'juan Carlos',
      });
    });

    it('lanza 404 cuando el usuario no existe', async () => {
      repositorio.updateUser.mockResolvedValue(null);

      await expect(
        servicio.updateUser('uuid-inexistente', { username: 'x' }),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 antes de consultar cuando no llega uuid', async () => {
      await expect(servicio.updateUser('', { username: 'x' })).rejects.toMatchObject({
        status: 400,
      });
      expect(repositorio.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('devuelve el usuario eliminado', async () => {
      repositorio.deleteUser.mockResolvedValue(usuarioDePrueba());

      const respuesta = await servicio.deleteUser(usuarioDePrueba().uuid);

      expect(respuesta.data).toMatchObject({ uuid: usuarioDePrueba().uuid });
    });

    it('lanza 404 cuando el usuario no existe', async () => {
      repositorio.deleteUser.mockResolvedValue(null);

      await expect(servicio.deleteUser('uuid-inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 antes de consultar cuando no llega uuid', async () => {
      await expect(servicio.deleteUser('')).rejects.toMatchObject({ status: 400 });
      expect(repositorio.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('devuelve la lista de usuarios', async () => {
      repositorio.getAllUsers.mockResolvedValue([usuarioDePrueba()]);

      const respuesta = await servicio.getAllUsers();

      expect(respuesta.success).toBe(true);
      expect(respuesta.data).toHaveLength(1);
    });

    /**
     * COMPORTAMIENTO ACTUAL, NO EL DESEADO.
     *
     * La guarda `if (!users)` nunca se cumple para un array vacio, porque `[]` es
     * truthy. La intencion era responder 404 cuando no hay usuarios; lo que
     * ocurre es que devuelve 200 con una lista vacia, que igual es razonable.
     */
    it('devuelve 200 con lista vacia, no 404, cuando no hay usuarios', async () => {
      repositorio.getAllUsers.mockResolvedValue([]);

      const respuesta = await servicio.getAllUsers();

      expect(respuesta.status).toBe(200);
      expect(respuesta.data).toEqual([]);
    });
  });

  describe('validaciones antes de tocar el repositorio', () => {
    it('todos los metodos que necesitan uuid validan antes de consultar', async () => {
      await expect(servicio.getUserByUuid('')).rejects.toMatchObject({ status: 400 });
      await expect(servicio.updateUser('', {})).rejects.toMatchObject({ status: 400 });
      await expect(servicio.deleteUser('')).rejects.toMatchObject({ status: 400 });
      await expect(servicio.getUserByEmail('')).rejects.toMatchObject({ status: 400 });

      expect(repositorio.getUserByUuid).not.toHaveBeenCalled();
      expect(repositorio.updateUser).not.toHaveBeenCalled();
      expect(repositorio.deleteUser).not.toHaveBeenCalled();
      expect(repositorio.getUserByEmail).not.toHaveBeenCalled();
    });
  });
});
