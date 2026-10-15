import { JwtHelpers } from '@/lib/Jwt/JwtHelpers';
import { describe, expect, it } from 'vitest';

const helpers = new JwtHelpers('secreto-de-test', 'secreto-de-refresh-de-test');

describe('JwtHelpers', () => {
  describe('generateToken y verifyToken', () => {
    it('firma un token que luego se puede verificar', () => {
      const token = helpers.generateToken({ payload: 'uuid-de-usuario' }, '2d');

      expect(helpers.verifyToken(token)?.payload).toBe('uuid-de-usuario');
    });

    it('devuelve null en vez de lanzar cuando el token es invalido', () => {
      expect(helpers.verifyToken('token-inventado')).toBeNull();
    });

    it('devuelve null cuando el token fue firmado con otro secreto', () => {
      const otro = new JwtHelpers('otro-secreto', 'otro-secreto');
      const token = otro.generateToken({ payload: 'uuid-de-usuario' }, '2d');

      expect(helpers.verifyToken(token)).toBeNull();
    });
  });

  describe('generateRefreshToken y verifyRefreshToken', () => {
    it('firma un refresh token verificable con el secreto de refresh', () => {
      const token = helpers.generateRefreshToken({ payload: 'uuid-de-usuario' }, '7d');

      expect(helpers.verifyRefreshToken(token)?.payload).toBe('uuid-de-usuario');
    });

    it('un refresh token no sirve como token de acceso', () => {
      const refreshToken = helpers.generateRefreshToken({ payload: 'uuid-de-usuario' }, '7d');

      expect(helpers.verifyToken(refreshToken)).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    /**
     * COMPORTAMIENTO ACTUAL, NO EL DESEADO.
     *
     * `refreshAccessToken` devuelve `generateRefreshToken(...)`, es decir, firma
     * con el secreto de refresh y no con el de acceso. Quien llame a este metodo
     * esperando un access token obtiene un refresh token, y despues
     * `verifyToken` lo rechaza. Queda congelado aca para que el cambio sea
     * explicito y no accidental.
     */
    it('devuelve null cuando el refresh token no es valido', () => {
      expect(helpers.refreshAccessToken('refresh-inventado')).toBeNull();
    });

    it('lanza en vez de refrescar: jsonwebtoken rechaza el exp que ya trae el payload', () => {
      const refreshToken = helpers.generateRefreshToken({ payload: 'uuid-de-usuario' }, '7d');

      /**
       * COMPORTAMIENTO ACTUAL, NO EL DESEADO.
       *
       * El refresh token decodificado ya trae `exp`, y `generateRefreshToken`
       * vuelve a pasar `expiresIn`. jsonwebtoken lanza "the payload already has
       * an exp property". Es decir: `refreshAccessToken` no refresca, revienta.
       * Y ademas firmaria con el secreto de refresh, no con el de acceso.
       * Queda congelado aca; la correccion es S11.
       */
      expect(() => helpers.refreshAccessToken(refreshToken, '1h')).toThrow(
        /already has an "exp" property/,
      );
    });
  });
});
