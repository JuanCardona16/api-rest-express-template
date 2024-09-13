import { getModel } from "@/config/database";
import { Collection } from "@/constants";
import { RequestHandler } from "express";
import UserMongoSchema from "../../user/models/User.model";
import { setError } from "@/helpers";
import { comparePassword, generateToken } from "../helpers";

export class AuthServices {
  register: RequestHandler = async (req, res, next) => {
    const userData = req.body;

    const model = getModel(Collection.USERS, UserMongoSchema);
    const user = await model.findOne({ email: userData.email });

    if (user) return next(setError(404, "User already exists"));

    const newUser = new model(userData);

    const userInDB = await newUser.save();

    return res.status(201).json({
      user: userInDB,
    });
  };

  login: RequestHandler = async (req, res, next) => {
    const model = getModel(Collection.USERS, UserMongoSchema);
    const userInDB = await model.findOne({ email: req.body.email });

    if (!userInDB) return next(setError(401, "Not authorized"));

    if (!comparePassword(req.body.password, userInDB.password))
      return next(setError(403, "Password incorrect"));

    const token = generateToken({ uuid: userInDB.uuid as string });

    return res.status(200).json({
      accessToken: token,
    });
  };
}
