import { jwtHelpers } from '@/lib/Jwt';
import { JwtHelpers } from '@/lib/Jwt/JwtHelpers';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

const helpers = new JwtHelpers('secreto-de-test', 'secreto-de-refresh-de-test');

// El singleton configurado tambien tiene que cumplir el mismo contrato.
void jwtHelpers;

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
    it('devuelve null cuando el refresh token no es valido', () => {
      expect(helpers.refreshAccessToken('refresh-inventado')).toBeNull();
    });

    it('devuelve un token que verifica con el secreto de acceso', () => {
      const refreshToken = helpers.generateRefreshToken({ payload: 'uuid-de-usuario' }, '7d');

      const accessToken = helpers.refreshAccessToken(refreshToken, '1h');

      expect(accessToken).not.toBeNull();
      expect(helpers.verifyToken(accessToken!)?.payload).toBe('uuid-de-usuario');
    });

    it('el token renovado no conserva el exp del refresh token original', () => {
      const refreshToken = helpers.generateRefreshToken({ payload: 'uuid-de-usuario' }, '7d');
      const decodificado = helpers.verifyRefreshToken<{ payload: string; exp: number }>(
        refreshToken,
      );

      const accessToken = helpers.refreshAccessToken(refreshToken, '1h')!;
      const nuevos = jwt.decode(accessToken) as { exp: number };

      // 1h contra los 7d del refresh token: si fueran el mismo, exp coincidiria.
      expect(nuevos.exp).toBeLessThan(decodificado!.exp);
    });

    it('respeta el expiresIn pedido', () => {
      const refreshToken = helpers.generateRefreshToken({ payload: 'uuid-de-usuario' }, '7d');

      const accessToken = helpers.refreshAccessToken(refreshToken, '30d')!;
      const decodificado = jwt.decode(accessToken) as { exp: number };
      const original = jwt.decode(refreshToken) as { exp: number };

      expect(decodificado.exp).toBeGreaterThan(original.exp);
    });
  });
});
