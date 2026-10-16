/**
 * Guarda los códigos de verificación de recuperación de contraseña.
 *
 * Antes tenía un único `this.key` global, el "email actual": si dos personas
 * pedían recuperación al mismo tiempo, una sobrescribía el código de la otra y
 * ninguna podía completarla. El código va asociado a su email.
 */
class InMemoryCodeSecurity {
  private codes: Map<string, { code: string; expiresAt: number }> = new Map();

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Genera y almacena un código para un email, con expiración.
   *
   * @param email - Email al que pertenece el código
   * @param expiry - Minutos de expiración, por defecto 5
   */
  public createCode(email: string, expiry: number = 5): string {
    const code = this.generateCode();

    this.codes.set(email, { code, expiresAt: Date.now() + expiry * 60 * 1000 });

    return code;
  }

  /**
   * Verifica el código de un email concreto. El código se consume: un mismo
   * código no sirve dos veces, ni para el mismo email ni para otro.
   *
   * @param email - Email dueño del código
   * @param code - Código ingresado
   */
  public verifyCode(email: string, code: string): boolean {
    const data = this.codes.get(email);

    if (!data) return false;

    if (Date.now() > data.expiresAt) {
      this.codes.delete(email);
      return false;
    }

    if (data.code !== code) return false;

    this.codes.delete(email);

    return true;
  }

  /**
   * Devuelve el código vigente de un email.
   *
   * Existe para las pruebas: sin esto habría que llegar al email real para
   * completar el flujo, y el flujo quedaría sin cobertura.
   */
  public getCodeForTesting(email: string): string | null {
    return this.codes.get(email)?.code ?? null;
  }

  /** Limpia los códigos. Pensado para pruebas. */
  public clear(): void {
    this.codes.clear();
  }
}

export const InMemoryCodeSecurityService = new InMemoryCodeSecurity();

export default InMemoryCodeSecurityService;
