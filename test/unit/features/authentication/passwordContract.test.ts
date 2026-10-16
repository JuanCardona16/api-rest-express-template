import { registerSchema } from '@/features/authentication/schemas/auth.schemas';
import PasswordHelpers from '@/lib/Passwords/PasswordHelpers';
import { describe, expect, it } from 'vitest';

/**
 * Hay una sola regla de contrasena valida y un solo lugar que la define.
 *
 * Antes el schema de Zod aceptaba 6 a 12 caracteres sin exigir categorias, y el
 * pre-save de mongoose exigia las cuatro categorias hasta 14. Una contrasena
 * podia pasar la puerta del controller y reventar en el hook con un 500.
 */
describe('contrato de validacion de contrasena', () => {
  const base = { username: 'juan', email: 'juan@example.com', authenticationMethod: 'BASIC' };

  const resultado = (password: string) => registerSchema.safeParse({ ...base, password }).success;

  it('acepta una contrasena que cumple la regla compartida', () => {
    expect(resultado('Password1!')).toBe(true);
  });

  it('rechaza una contrasena que el helper considera invalida', () => {
    // 10 caracteres, pasa el minimo del schema, pero no tiene mayuscula.
    expect(PasswordHelpers.validateCharacters('password1!')).toBe(false);
    expect(resultado('password1!')).toBe(false);
  });

  it('rechaza una contrasena sin caracter especial aunque sea larga', () => {
    expect(resultado('Password12345')).toBe(false);
  });

  it('rechaza una contrasena demasiado corta', () => {
    expect(resultado('Aa1!aa')).toBe(false);
  });

  it('rechaza una contrasena demasiado larga', () => {
    expect(resultado('Password1!Password1!')).toBe(false);
  });

  it('el schema y el helper coinciden en todos los casos de la tabla', () => {
    const candidatas = [
      'Password1!',
      'Aa1!aa',
      'Aa1!aaaa',
      'password1!',
      'PASSWORD1!',
      'Password123',
      'Password1!Password1!',
      'Aa1!aa',
      '',
    ];

    for (const candidata of candidatas) {
      expect(
        resultado(candidata),
        `discrepancia entre schema y PasswordHelpers para "${candidata}"`,
      ).toBe(PasswordHelpers.validateCharacters(candidata));
    }
  });
});
