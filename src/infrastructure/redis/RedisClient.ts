import { REDIS_ENABLED, REDIS_URL } from '@/config/env/enviroments';
import Redis from 'ioredis';

/**
 * Puerto de cache. Lo consume `PasswordVerificationCache` por constructor para
 * que los tests puedan doblarlo, igual que `IUserRepository`.
 */
export interface PasswordCachePort {
  get(key: string): Promise<string | null>;
  setEx(key: string, value: string, ttlSeconds: number): Promise<void>;
}

/**
 * Cliente de Redis con degradacion silenciosa.
 *
 * Un cache no puede ser una dependencia dura: si Redis cae, cada comando tiene
 * que fallar rapido y devolver "no hay nada cacheado", no romper el request ni
 * dejar el comando colgado esperando reconexion.
 */
class RedisClient implements PasswordCachePort {
  private client: Redis | null = null;
  private healthy = false;

  constructor() {
    if (!REDIS_ENABLED) return;

    try {
      this.client = new Redis(REDIS_URL, {
        // Sin esto, un Redis caido encola los comandos para siempre y cada login
        // se queda esperando una reconexion que puede no llegar nunca.
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      this.client.on('ready', () => {
        this.healthy = true;
      });

      this.client.on('error', () => {
        this.healthy = false;
      });

      this.client.on('end', () => {
        this.healthy = false;
      });

      // El primer comando dispara la conexion. Si falla, ioredis reintenta solo.
      this.client.connect().catch(() => undefined);
    } catch {
      this.client = null;
    }
  }

  get isEnabled(): boolean {
    return REDIS_ENABLED && this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.healthy) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async setEx(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.client || !this.healthy) return;
    try {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } catch {
      // Cachear es una aceleracion. Si falla, el proximo login hashea de nuevo.
    }
  }
}

export default new RedisClient();
