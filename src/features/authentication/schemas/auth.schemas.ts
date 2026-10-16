import { z } from 'zod';
import { passwordSchema } from './password.schema';

export const registerSchema = z.object({
  username: z.string({
    required_error: 'Username is required',
  }),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email({ message: 'Invalid email' }),
  password: passwordSchema,
  authenticationMethod: z.enum(['BASIC', 'GOOGLE']).default('BASIC'),
});

/**
 * En el login el password solo tiene que estar presente.
 *
 * Aplicar aqui la regla de creacion haria que una contrasena incorrecta pero
 * debil devolviera 400 en vez del 403 que corresponde: el cliente aprenderia las
 * reglas de validacion por la puerta de atrás y la respuesta seria confusa.
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email({ message: 'Invalid email' }),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});
