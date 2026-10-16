import type { PasswordCachePort } from '@/features/authentication/services/passwordVerificationCache';

/**
 * Doble del puerto de cache de verificacion de contrasena.
 *
 * A diferencia de un Map plano, permite dejar caer Redis a proposito: es el caso
 * que importa, porque el cache jamas puede ser una dependencia dura.
 */
export class CacheDeContrasenasMock implements PasswordCachePort {
  public store = new Map<string, string>();
  public lecturas = 0;
  public escrituras = 0;
  public caido = false;

  /** Lo que el cliente devuelve cuando falla la conexion. */
  public siguienteRespuesta: string | null = null;

  reset(): void {
    this.store.clear();
    this.lecturas = 0;
    this.escrituras = 0;
    this.caido = false;
    this.siguienteRespuesta = null;
  }

  /** Simula que el par (clave, valor) ya esta cacheado. */
  cachear(clave: string, valor: string): void {
    this.store.set(clave, valor);
  }

  get tamano(): number {
    return this.store.size;
  }

  async get(key: string): Promise<string | null> {
    this.lecturas++;
    if (this.caido) throw new Error('redis no responde');
    return this.siguienteRespuesta !== null
      ? this.siguienteRespuesta
      : (this.store.get(key) ?? null);
  }

  async setEx(key: string, value: string): Promise<void> {
    this.escrituras++;
    if (this.caido) throw new Error('redis no responde');
    this.store.set(key, value);
  }
}
