import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { setError } from "../setError/setError";

export const validateSchema = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body)
    next()
  } catch (error) {
    return res.status(400).json(setError(400, `${error}`))
  }
}