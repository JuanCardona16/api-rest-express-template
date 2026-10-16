import { passwordSchema } from './password.schema';
import { z } from 'zod';

const email = z.string({ required_error: 'Email is required' }).email({ message: 'Invalid email' });

export const forgotPasswordSchema = z.object({ email });

export const verifyCodeSchema = z.object({
  email,
  code: z.string({ required_error: 'Code is required' }).length(6, 'Code must be 6 digits'),
});

export const changePasswordSchema = z.object({
  email,
  token: z.string({ required_error: 'Token is required' }),
  newPassword: passwordSchema,
});

export const googleLoginSchema = z.object({
  code: z.string({ required_error: 'Code is required' }).min(1, 'Code is required'),
});
