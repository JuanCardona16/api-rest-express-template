import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string({
    required_error: 'Username is required',
  }),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email({ message: 'Invalid email' }),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(12, { message: 'Password must be at most 12 characters' }),
  authenticationMethod: z.enum(['BASIC', 'GOOGLE']).default('BASIC'),
});

export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email({ message: 'Invalid email' }),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(12, { message: 'Password must be at most 12 characters' }),
});
