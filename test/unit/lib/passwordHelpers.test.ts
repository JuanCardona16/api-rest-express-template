import PasswordHelpers from '@/lib/Passwords/PasswordHelpers';
import { describe, expect, it } from 'vitest';

/**
 * Comportamiento actual congelado. Estos tests no preguntan si el diseno es el
 * correcto: preguntan que hace hoy el codigo, para que un cambio futuro sea
 * una decision y no un accidente.
 */
describe('PasswordHelpers', () => {
  describe('validateCharacters', () => {
    it('acepta una contrasena con 8 a 14 caracteres y las cuatro categorias', () => {
      expect(PasswordHelpers.validateCharacters('Password1!')).toBe(true);
      expect(PasswordHelpers.validateCharacters('Aa1!aaaa')).toBe(true);
    });

    it('rechaza una contrasena sin mayuscula', () => {
      expect(PasswordHelpers.validateCharacters('password1!')).toBe(false);
    });

    it('rechaza una contrasena sin caracter especial', () => {
      expect(PasswordHelpers.validateCharacters('Password123')).toBe(false);
    });

    it('rechaza una contrasena de menos de 8 caracteres', () => {
      expect(PasswordHelpers.validateCharacters('Aa1!aa')).toBe(false);
    });

    it('rechaza una contrasena de mas de 14 caracteres', () => {
      expect(PasswordHelpers.validateCharacters('Password1!Password1!')).toBe(false);
    });
  });

  describe('hasheo no bloqueante', () => {
    // Estas dos pruebas congelan una decision de diseno, no un detalle de
    // implementacion: `hashSync` y `compareSync` congelan el event loop entero
    // de Node durante cada operacion. Con trafico concurrente, un solo login
    // detenia la API completa. bcrypt tiene variantes asincronas que corren en
    // el threadpool y liberan el hilo principal.
    it('generateHashing devuelve una promesa, no un string ya resuelto', () => {
      expect(PasswordHelpers.generateHashing('Password1!', 12)).toBeInstanceOf(Promise);
    });

    it('compare devuelve una promesa, no un booleano ya resuelto', async () => {
      const hash = await PasswordHelpers.generateHashing('Password1!', 12);

      expect(PasswordHelpers.compare('Password1!', hash)).toBeInstanceOf(Promise);
    });

    it('el event loop responde mientras hashea', async () => {
      let respondsDuringHash = false;
      const probing = setTimeout(() => {
        respondsDuringHash = true;
      }, 0);

      await PasswordHelpers.generateHashing('Password1!', 12);
      const result = respondsDuringHash;
      clearTimeout(probing);

      // Con `hashSync` el temporizador no puede correr hasta que el hash
      // termina: el hilo principal estaba ocupado todo ese tiempo.
      expect(result).toBe(true);
    });
  });

  describe('generateHashing y compare', () => {
    it('produce un hash que verifica contra la contrasena original', async () => {
      const hash = await PasswordHelpers.generateHashing('Password1!', 12);

      expect(hash).not.toBe('Password1!');
      expect(await PasswordHelpers.compare('Password1!', hash)).toBe(true);
    });

    it('falla la comparacion con una contrasena distinta', async () => {
      const hash = await PasswordHelpers.generateHashing('Password1!', 12);

      expect(await PasswordHelpers.compare('OtraClave1!', hash)).toBe(false);
    });

    it('genera un hash distinto en cada llamada', async () => {
      const primero = await PasswordHelpers.generateHashing('Password1!', 12);
      const segundo = await PasswordHelpers.generateHashing('Password1!', 12);

      expect(primero).not.toBe(segundo);
    });
  });

  describe('generateSecurePassword', () => {
    it('genera una contrasena que supera su propia validacion de caracteres', () => {
      const generada = PasswordHelpers.generateSecurePassword('juan');

      expect(PasswordHelpers.validateCharacters(generada)).toBe(true);
    });

    it('genera una contrasena distinta en cada llamada', () => {
      expect(PasswordHelpers.generateSecurePassword('juan')).not.toBe(
        PasswordHelpers.generateSecurePassword('juan'),
      );
    });
  });
});
