import { CustomError } from "@/lib";
import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";

export const validateWithZod = (schema: ZodSchema, type: 'body' | 'params' | 'query' = 'body') => (req: Request, _res: Response, next: NextFunction) => {
  try {
    schema.parse(req[type]);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(CustomError(400, error.errors.map(e => e.message).join(', ')))
    }
    next(error);
  }
}