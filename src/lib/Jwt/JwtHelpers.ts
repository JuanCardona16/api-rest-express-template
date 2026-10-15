import jwt from 'jsonwebtoken';
import { Payload } from './types/TokenPayload';

export class JwtHelpers {
  private SECRET_KEY: string;
  private SECRET_REFRESH_KEY: string;

  constructor(secretKey: string, secretRefreshKey: string) {
    this.SECRET_KEY = secretKey;
    this.SECRET_REFRESH_KEY = secretRefreshKey;
  }

  public generateToken<T>(payload: Payload<T>, expiresIn: string | number = '24h'): string {
    return jwt.sign(payload!, this.SECRET_KEY, {
      expiresIn,
    } as jwt.SignOptions);
  }

  public generateRefreshToken<T>(payload: Payload<T>, expiresIn: string | number = '7d'): string {
    return jwt.sign(payload!, this.SECRET_REFRESH_KEY, {
      expiresIn,
    } as jwt.SignOptions);
  }

  verifyToken<T>(payload: string): Payload<T> | null {
    try {
      return jwt.verify(payload!, this.SECRET_KEY) as Payload<T>;
    } catch {
      return null;
    }
  }

  verifyRefreshToken<T>(token: string): T | null {
    try {
      return jwt.verify(token, this.SECRET_REFRESH_KEY) as T;
    } catch {
      return null;
    }
  }

  /**
   * Refresca un access token a partir de un refresh token valido.
   *
   * El payload decodificado ya trae `exp` e `iat`. Firmarlo otra vez sin
   * quitarlos hace que jsonwebtoken lance "the payload already has an exp
   * property", y ademas hay que firmarlo con el secreto de acceso, no con el de
   * refresh: un access token firmado con el secreto equivocado no lo verifica
   * ni el propio sistema.
   */
  refreshAccessToken<T>(refreshToken: string, expiresIn: string | number = '1h'): string | null {
    const decodificado = this.verifyRefreshToken<Payload<T>>(refreshToken);

    if (!decodificado) return null;

    const { iat: _iat, exp: _exp, ...payload } = decodificado as unknown as Record<string, unknown>;

    return jwt.sign(payload as jwt.JwtPayload, this.SECRET_KEY, {
      expiresIn,
    } as jwt.SignOptions);
  }
}
