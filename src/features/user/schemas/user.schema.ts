import { z } from 'zod';

export const userSchema = z.object({
  uuid: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(6),
})

export const uuidParamsSchema = z.object({
  uuid: z.string().uuid({ message: 'Invalid UUID' }),
})

export const emailParamsSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
})