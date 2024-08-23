import { getModel } from "@/config/database";
import { Collection } from "@/constants";
import { setError } from "@/helpers";
import { RequestHandler } from "express";
import { verifyToken } from "../helpers";
import UserMongoSchema from "../models/User.model";

export const authorize: RequestHandler = async (req, _res, next) => {
  try {
    const model = getModel(Collection.USERS, UserMongoSchema);

    const token = req.headers.authorization;
    if (!token) return next(setError(400, "Not authorized"));

    const tokenNotBearer = token.replace("Bearer", "");

    const validateToken = verifyToken(tokenNotBearer);
    if (!validateToken || !validateToken.uuid)
      return next(setError(401, "Not authorized"));

    const user = await model.findById(validateToken.uuid);
    if (!user) return next(setError(404, "User not found"));

    (req as any).user = user;

    next();
  } catch (error) {
    return next(setError(401, `Not authorized -> ${error}`));
  }
};
