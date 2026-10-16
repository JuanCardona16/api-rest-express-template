import type { PasswordCachePort } from '@/features/authentication/services/passwordVerificationCache';
import { PasswordVerificationCache } from '@/features/authentication/services/passwordVerificationCache';
import { beforeEach, describe, expect, it } from 'vitest';

/**
 * Doble del puerto de cache. Reproduce lo unico que el cache necesita saber:
 * que clave hay, que valor tiene y cuando expira.
 */
class RedisPDouble implements PasswordCachePort {
  public store = new Map<string, string>();
  public ttlRequests: number[] = [];
  public failEverything = false;

  async get(key: string): Promise<string | null> {
    if (this.failEverything) throw new Error('redis caido');
    return this.store.get(key) ?? null;
  }

  async setEx(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.failEverything) throw new Error('redis caido');
    this.ttlRequests.push(ttlSeconds);
    this.store.set(key, value);
  }
}

const HASH_ACTUAL = '$2b$12$hashvigente';
const HASH_ANTERIOR = '$2b$12$hashviejo';

describe('PasswordVerificationCache', () => {
  let redis: RedisPDouble;
  let cache: PasswordVerificationCache;

  beforeEach(() => {
    redis = new RedisPDouble();
    cache = new PasswordVerificationCache(redis, 'secreto-de-prueba', 30);
  });

  describe('wasRecentlyVerified', () => {
    it('confirma cuando la entrada guardada es el hash vigente', async () => {
      await cache.remember('uuid-1', 'Password1!', HASH_ACTUAL);

      await expect(cache.wasRecentlyVerified('uuid-1', 'Password1!', HASH_ACTUAL)).resolves.toBe(
        true,
      );
    });

    it('falla cuando la contrasena es distinta', async () => {
      await cache.remember('uuid-1', 'Password1!', HASH_ACTUAL);

      await expect(cache.wasRecentlyVerified('uuid-1', 'OtraClave1!', HASH_ACTUAL)).resolves.toBe(
        false,
      );
    });

    it('falla cuando el usuario no esta cacheado', async () => {
      await expect(cache.wasRecentlyVerified('nadie', 'Password1!', HASH_ACTUAL)).resolves.toBe(
        false,
      );
    });

    // Este es el requisito de invalidacion. Si la contrasena cambio en la base,
    // el hash vigente es distinto al que se guardo, y el cache se descarta solo.
    it('falla cuando la contrasena cambio y el hash de la base es otro', async () => {
      await cache.remember('uuid-1', 'Password1!', HASH_ANTERIOR);

      await expect(cache.wasRecentlyVerified('uuid-1', 'Password1!', HASH_ACTUAL)).resolves.toBe(
        false,
      );
    });
  });

  describe('la clave no expone la contrasena', () => {
    it('no contiene la contrasena en claro', async () => {
      await cache.remember('uuid-1', 'Password1!', HASH_ACTUAL);

      const [clave] = [...redis.store.keys()];
      expect(clave).not.toContain('Password1!');
      expect(clave.startsWith('pw:uuid-1:')).toBe(true);
    });

    it('produce la misma clave para el mismo par usuario y contrasena', async () => {
      await cache.remember('uuid-1', 'Password1!', HASH_ACTUAL);
      const [primera] = [...redis.store.keys()];

      await cache.remember('uuid-1', 'Password1!', HASH_ACTUAL);
      const [segunda] = [...redis.store.keys()];

      expect(primera).toBe(segunda);
    });

    it('produce claves distintas para contrasenas distintas del mismo usuario', async () => {
      await cache.remember('uuid-1', 'Password1!', HASH_ACTUAL);
      await cache.remember('uuid-1', 'OtraClave1!', HASH_ACTUAL);

      expect(redis.store.size).toBe(2);
    });

    it('separa usuarios distintos aunque la contrasena sea la misma', async () => {
      await cache.remember('uuid-1', 'Password1!', HASH_ACTUAL);
      await cache.remember('uuid-2', 'Password1!', HASH_ACTUAL);

      expect(redis.store.size).toBe(2);
    });
  });

  describe('la ventana TTL', () => {
    it('guarda con la ventana configurada', async () => {
      await cache.remember('uuid-1', 'Password1!', HASH_ACTUAL);

      expect(redis.ttlRequests).toEqual([30]);
    });

    it('respeta otra ventana si se configura otra', async () => {
      const corto = new PasswordVerificationCache(redis, 'secreto-de-prueba', 5);
      await corto.remember('uuid-1', 'Password1!', HASH_ACTUAL);

      expect(redis.ttlRequests).toEqual([5]);
    });
  });

  describe('degradacion cuando redis no responde', () => {
    beforeEach(() => {
      redis.failEverything = true;
    });

    // El cache es una aceleracion. Si se cae, el login tiene que seguir
    // funcionando hasheando: no puede aparecer una forma nueva de caida.
    it('responde false en vez de propagar el error', async () => {
      await expect(cache.wasRecentlyVerified('uuid-1', 'Password1!', HASH_ACTUAL)).resolves.toBe(
        false,
      );
    });

    it('no propaga el error al recordar', async () => {
      await expect(cache.remember('uuid-1', 'Password1!', HASH_ACTUAL)).resolves.toBeUndefined();
    });
  });
});
