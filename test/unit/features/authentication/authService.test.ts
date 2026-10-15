import AuthenticationServices from '@/features/authentication/services/auth.service';
import PasswordHelpers from '@/lib/Passwords/PasswordHelpers';
import { jwtHelpers } from '@/lib/Jwt';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  comoRepositorio,
  crearRepositorioDeUsuariosMock,
  datosDeRegistro,
  RepositorioDeUsuariosMock,
  usuarioDePrueba,
} from '../../../shared/userRepositoryMock';

/**
 * Reglas de negocio de la autenticacion, probadas contra el puerto y no contra
 * mongo. Si estas reglas se rompen, la API responde distinto.
 */
describe('AuthenticationServices', () => {
  let repositorio: RepositorioDeUsuariosMock;
  let servicio: AuthenticationServices;

  beforeEach(() => {
    repositorio = crearRepositorioDeUsuariosMock();
    servicio = new AuthenticationServices(comoRepositorio(repositorio));
  });

  describe('register', () => {
    it('crea el usuario y devuelve un token de acceso', async () => {
      const respuesta = await servicio.register(datosDeRegistro());

      expect(repositorio.createUser).toHaveBeenCalledTimes(1);
      expect(respuesta.success).toBe(true);
      expect(typeof respuesta.data).toBe('string');
      expect(jwtHelpers.verifyToken(respuesta.data as string)?.payload).toBe(
        usuarioDePrueba().uuid,
      );
    });

    it('el token dura 2 dias', async () => {
      const respuesta = await servicio.register(datosDeRegistro());
      const decodificado = jwtHelpers.verifyToken<{ payload: string; exp: number; iat: number }>(
        respuesta.data as string,
      );

      const duracionSegundos = decodificado!.exp - decodificado!.iat;
      expect(duracionSegundos).toBe(2 * 24 * 60 * 60);
    });

    it('rechaza con 400 cuando no llegan datos', async () => {
      await expect(servicio.register(undefined as never)).rejects.toMatchObject({
        status: 400,
        message: 'Bad Request',
      });
      expect(repositorio.createUser).not.toHaveBeenCalled();
    });

    it('el estado de la respuesta es 200', async () => {
      const respuesta = await servicio.register(datosDeRegistro());

      expect(respuesta.status).toBe(200);
    });
  });

  describe('login', () => {
    const contrasenaValida = 'Password1!';

    beforeEach(() => {
      repositorio.getPasswordByEmail.mockResolvedValue({
        uuid: usuarioDePrueba().uuid,
        password: PasswordHelpers.generateHashing(contrasenaValida, 12),
      });
    });

    it('devuelve un token cuando las credenciales son correctas', async () => {
      const respuesta = await servicio.login({
        email: 'juan@example.com',
        password: contrasenaValida,
      });

      expect(respuesta.success).toBe(true);
      expect(jwtHelpers.verifyToken(respuesta.data as string)?.payload).toBe(
        usuarioDePrueba().uuid,
      );
    });

    it('rechaza con 404 cuando el usuario no existe', async () => {
      repositorio.getPasswordByEmail.mockResolvedValue(null);

      await expect(
        servicio.login({ email: 'nadie@example.com', password: contrasenaValida }),
      ).rejects.toMatchObject({ status: 404, message: 'User not found' });
    });

    it('rechaza con 403 cuando la contrasena no coincide', async () => {
      await expect(
        servicio.login({ email: 'juan@example.com', password: 'OtraClave1!' }),
      ).rejects.toMatchObject({ status: 403, message: 'Password incorrect' });
    });

    it('no distingue 404 de 403 por tiempo: ambos revelan que el usuario existe', async () => {
      // Ambos mensajes son distintos y ambos confirman que hubo una busqueda.
      // Este test documenta el comportamiento, no lo aprueba.
      const inicio404 = Date.now();
      repositorio.getPasswordByEmail.mockResolvedValue(null);
      await servicio
        .login({ email: 'nadie@example.com', password: contrasenaValida })
        .catch(() => null);
      const fin404 = Date.now();

      const inicio403 = Date.now();
      await servicio
        .login({ email: 'juan@example.com', password: 'OtraClave1!' })
        .catch(() => null);
      const fin403 = Date.now();

      // Mismo orden de magnitud: no hay una diferencia de tiempo obvia.
      expect(Math.abs(fin404 - inicio404 - (fin403 - inicio403))).toBeLessThan(50);
    });

    it('rechaza con 400 cuando no llegan datos', async () => {
      await expect(servicio.login(undefined as never)).rejects.toMatchObject({ status: 400 });
      expect(repositorio.getPasswordByEmail).not.toHaveBeenCalled();
    });

    it('no filtra la existencia del usuario cuando la contrasena es vacia', async () => {
      await expect(
        servicio.login({ email: 'juan@example.com', password: '' }),
      ).rejects.toMatchObject({ status: 403 });
    });
  });
});
