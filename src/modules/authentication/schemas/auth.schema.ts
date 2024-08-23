import { z } from 'zod'

export const registerSchameZod = z.object({
  username: z.string({
    required_error: 'username is required'
  }),
  email: z.string({
    required_error: 'email is required'
  }).email({
    message: 'invalid email'
  }),
  password: z.string({
    required_error: 'password is required'
  }).min(8, 'password must be at least 8 characters long')
    .max(14, 'Password must not exeed 14 characters')
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[\W_]/, { message: 'Password must contain at least one special character' })  
})

export const loginSchemaZod = z.object({
  email: z.string({
    required_error: 'email is required'
  }).email({
    message: 'invalid email'
  }),
  password: z.string({
    required_error: 'password is required'
  }).min(8, 'password must be at least 8 characters long')
    .max(14, 'Password must not exeed 14 characters')
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[\W_]/, { message: 'Password must contain at least one special character' })
})
