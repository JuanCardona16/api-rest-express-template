import PasswordHelpers from '@/lib/Passwords/PasswordHelpers';
import { z } from 'zod';

/**
 * Regla unica de contrasena valida.
 *
 * Antes Zod aceptaba 6 a 12 caracteres sin exigir nada mas, mientras el
 * pre-save de mongoose exigia mayuscula, minuscula, numero y especial. Una
 * contrasena podia pasar la validacion del controller y reventar despues con
 * un 500, que es la peor respuesta posible para una entrada invalida.
 *
 * Ahora el schema y el hook consultan la misma funcion.
 */
export const PASSWORD_RULE_MESSAGE =
  'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character';

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .refine(PasswordHelpers.validateCharacters, { message: PASSWORD_RULE_MESSAGE });
