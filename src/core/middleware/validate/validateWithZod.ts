import { CustomError } from '@/lib';
import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validateWithZod =
  (schema: ZodSchema, type: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req[type]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // `issues` es el nombre actual; `errors` quedo deprecado en Zod 3.25.
        return next(CustomError(400, error.issues.map((issue) => issue.message).join(', ')));
      }
      next(error);
    }
  };
