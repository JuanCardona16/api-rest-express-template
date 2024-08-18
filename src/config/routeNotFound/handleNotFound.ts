import { RequestHandler } from "express";
import { setError } from "@/helpers";

export const handleNotFound: RequestHandler = (_req, _res, next) => {
  next(setError(400, "Route Not Found"));
};
