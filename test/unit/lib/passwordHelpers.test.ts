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

  describe('generateHashing y compare', () => {
    it('produce un hash que verifica contra la contrasena original', () => {
      const hash = PasswordHelpers.generateHashing('Password1!', 12);

      expect(hash).not.toBe('Password1!');
      expect(PasswordHelpers.compare('Password1!', hash)).toBe(true);
    });

    it('falla la comparacion con una contrasena distinta', () => {
      const hash = PasswordHelpers.generateHashing('Password1!', 12);

      expect(PasswordHelpers.compare('OtraClave1!', hash)).toBe(false);
    });

    it('genera un hash distinto en cada llamada', () => {
      const primero = PasswordHelpers.generateHashing('Password1!', 12);
      const segundo = PasswordHelpers.generateHashing('Password1!', 12);

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
