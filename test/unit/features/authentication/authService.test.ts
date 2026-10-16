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
import { CacheDeContrasenasMock } from '../../../shared/passwordCacheMock';
import { PasswordVerificationCache } from '@/features/authentication/services/passwordVerificationCache';

/**
 * Reglas de negocio de la autenticacion, probadas contra el puerto y no contra
 * mongo. Si estas reglas se rompen, la API responde distinto.
 */
describe('AuthenticationServices', () => {
  let repositorio: RepositorioDeUsuariosMock;
  let cache: CacheDeContrasenasMock;
  let servicio: AuthenticationServices;

  beforeEach(() => {
    repositorio = crearRepositorioDeUsuariosMock();
    cache = new CacheDeContrasenasMock();
    // El puerto va doblado, pero la logica del cache es la real: asi el test
    // cubre el camino completo, no un cache que siempre dice "verificado".
    servicio = new AuthenticationServices(
      comoRepositorio(repositorio),
      new PasswordVerificationCache(cache, 'secreto-de-prueba', 30),
    );
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

    beforeEach(async () => {
      repositorio.getPasswordByEmail.mockResolvedValue({
        uuid: usuarioDePrueba().uuid,
        password: await PasswordHelpers.generateHashing(contrasenaValida, 12),
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

    it('rechaza con credenciales invalidas cuando el usuario no existe', async () => {
      repositorio.getPasswordByEmail.mockResolvedValue(null);

      await expect(
        servicio.login({ email: 'nadie@example.com', password: contrasenaValida }),
      ).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });
    });

    it('rechaza con credenciales invalidas cuando la contrasena no coincide', async () => {
      await expect(
        servicio.login({ email: 'juan@example.com', password: 'OtraClave1!' }),
      ).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });
    });

    it('no revela si el email esta registrado: status, mensaje y code son identicos', async () => {
      repositorio.getPasswordByEmail.mockResolvedValue(null);
      const noExiste = await servicio
        .login({ email: 'nadie@example.com', password: contrasenaValida })
        .catch((error) => error);

      const contrasenaIncorrecta = await servicio
        .login({ email: 'juan@example.com', password: 'OtraClave1!' })
        .catch((error) => error);

      // Antes eran 404 'User not found' y 403 'Password incorrect': dos respuestas
      // distintas que confirmaban si una cuenta estaba registrada.
      expect(noExiste.status).toBe(contrasenaIncorrecta.status);
      expect(noExiste.message).toBe(contrasenaIncorrecta.message);
      expect(noExiste.code).toBe(contrasenaIncorrecta.code);
    });

    it('no distingue los dos casos por tiempo', async () => {
      const inicioNoExiste = Date.now();
      repositorio.getPasswordByEmail.mockResolvedValue(null);
      await servicio
        .login({ email: 'nadie@example.com', password: contrasenaValida })
        .catch(() => null);
      const finNoExiste = Date.now();

      const inicioIncorrecta = Date.now();
      await servicio
        .login({ email: 'juan@example.com', password: 'OtraClave1!' })
        .catch(() => null);
      const finIncorrecta = Date.now();

      expect(
        Math.abs(finNoExiste - inicioNoExiste - (finIncorrecta - inicioIncorrecta)),
      ).toBeLessThan(50);
    });

    it('rechaza con 400 cuando no llegan datos', async () => {
      await expect(servicio.login(undefined as never)).rejects.toMatchObject({ status: 400 });
      expect(repositorio.getPasswordByEmail).not.toHaveBeenCalled();
    });

    it('no filtra la existencia del usuario cuando la contrasena es vacia', async () => {
      await expect(
        servicio.login({ email: 'juan@example.com', password: '' }),
      ).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('login con cache de verificacion', () => {
    const contrasenaValida = 'Password1!';
    const credenciales = { email: 'juan@example.com', password: contrasenaValida };

    beforeEach(async () => {
      repositorio.getPasswordByEmail.mockResolvedValue({
        uuid: usuarioDePrueba().uuid,
        password: await PasswordHelpers.generateHashing(contrasenaValida, 12),
      });
    });

    it('cachea la verificacion despues de un login correcto', async () => {
      await servicio.login(credenciales);

      expect(cache.tamano).toBe(1);
    });

    it('el segundo login correcto resuelve sin volver a hashear', async () => {
      await servicio.login(credenciales);
      const escriturasTrasElPrimero = cache.escrituras;

      const segunda = await servicio.login(credenciales);

      expect(segunda.success).toBe(true);
      // Un acierto en el cache no debe volver a escribir: si escribiera, la
      // ventana TTL se renovaria en cada login y la revocacion no ocurriria.
      expect(cache.escrituras).toBe(escriturasTrasElPrimero);
    });

    it('nunca cachea una contrasena incorrecta', async () => {
      await expect(
        servicio.login({ email: 'juan@example.com', password: 'OtraClave1!' }),
      ).rejects.toMatchObject({ status: 401 });

      expect(cache.tamano).toBe(0);
    });

    it('vuelve a hashear cuando la contrasena cambio en la base', async () => {
      await servicio.login(credenciales);

      // La contrasena cambio: el hash vigente es distinto al que se cacheo, asi
      // que el cache tiene que descartarse solo y la nueva tiene que validarse.
      const hashNuevo = await PasswordHelpers.generateHashing('NuevaClave1!', 12);
      repositorio.getPasswordByEmail.mockResolvedValue({
        uuid: usuarioDePrueba().uuid,
        password: hashNuevo,
      });

      await expect(
        servicio.login({ email: 'juan@example.com', password: contrasenaValida }),
      ).rejects.toMatchObject({ status: 401 });

      await expect(
        servicio.login({ email: 'juan@example.com', password: 'NuevaClave1!' }),
      ).resolves.toMatchObject({ success: true });
    });

    // Requisito: el cache no puede ser una dependencia dura.
    it('el login sigue funcionando si redis esta caido', async () => {
      cache.caido = true;

      await expect(servicio.login(credenciales)).resolves.toMatchObject({ success: true });
    });

    it('el login sigue rechazando si redis esta caido', async () => {
      cache.caido = true;

      await expect(
        servicio.login({ email: 'juan@example.com', password: 'OtraClave1!' }),
      ).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });
    });

    // Si el cache respondiera "verificado" sin comprobar el valor, cualquiera
    // entraria con una contrasena incorrecta.
    it('no confía a ciegas un acierto del cache cuyo hash no es el de la base', async () => {
      cache.siguienteRespuesta = '$2b$12$hashInventado';

      await expect(
        servicio.login({ email: 'juan@example.com', password: 'OtraClave1!' }),
      ).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });
    });

    it('no consulta el cache cuando el usuario no existe', async () => {
      repositorio.getPasswordByEmail.mockResolvedValue(null);

      await expect(
        servicio.login({ email: 'nadie@example.com', password: contrasenaValida }),
      ).rejects.toMatchObject({ status: 401 });

      expect(cache.lecturas).toBe(0);
    });
  });
});
