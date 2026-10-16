import { PASSWORD_CACHE_TTL_SECONDS, TOKEN_SECRET_KEY } from '@/config/env/enviroments';
import RedisClient, { type PasswordCachePort } from '@/infrastructure/redis/RedisClient';
import { createHmac } from 'node:crypto';

export type { PasswordCachePort };

/**
 * Cache del **resultado** de comparar una contrasena, no de la sesion.
 *
 * `authorize` solo verifica la firma del JWT: bcrypt no esta en el camino de las
 * peticiones autenticadas, solo en `/auth/login`. Cachear el resultado de la
 * comparacion hace que un usuario que re-loguea varias veces dentro de la
 * ventana pague el hasheo una sola vez.
 *
 * La clave es `pw:{uuid}:{HMAC-SHA256(TOKEN_SECRET_KEY, contrasena)}`. El HMAC
 * va con el secreto del servidor, no un SHA plano: si alguien dumpea Redis, un
 * SHA plano le entregaria material equivalente a contrasena.
 *
 * El valor guardado es el hash de bcrypt que se verifico. Eso hace el cache
 * auto-invalidante: si la contrasena cambia en la base, el hash vigente es otro,
 * la comparacion no da igual y el cache se descarta solo, sin necesidad de un
 * `del` que pueda fallar o quedar desincronizado.
 */
export class PasswordVerificationCache {
  constructor(
    private readonly store: PasswordCachePort = RedisClient,
    private readonly secret: string = TOKEN_SECRET_KEY,
    private readonly ttlSeconds: number = PASSWORD_CACHE_TTL_SECONDS,
  ) {}

  private buildKey(uuid: string, password: string): string {
    const fingerprint = createHmac('sha256', this.secret).update(password).digest('hex');
    return `pw:${uuid}:${fingerprint}`;
  }

  /**
   * @param currentHash hash de bcrypt que la base tiene hoy para ese usuario.
   *   Si no coincide con lo cacheado, la contrasena cambio y hay que hashear.
   */
  async wasRecentlyVerified(uuid: string, password: string, currentHash: string): Promise<boolean> {
    try {
      const cached = await this.store.get(this.buildKey(uuid, password));
      return cached !== null && cached === currentHash;
    } catch {
      return false;
    }
  }

  async remember(uuid: string, password: string, hash: string): Promise<void> {
    try {
      await this.store.setEx(this.buildKey(uuid, password), hash, this.ttlSeconds);
    } catch {
      // Perder una entrada de cache solo cuesta un hasheo extra.
    }
  }
}

export default new PasswordVerificationCache();
