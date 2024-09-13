import { getModel } from "@/config/database";
import { Collection } from "@/constants";
import { RequestHandler } from "express";
import UserMongoSchema from "../models/User.model";
import { setError } from "@/helpers";

export class UserService {
  
  getUserInfo: RequestHandler = async (req, res, next) => {
    const { userId } = req.params

    const model = getModel(Collection.USERS, UserMongoSchema)
    const user = await model.findOne({ uuid: userId })

    if (!user) return next(setError(404, 'User not found'));

    return res.status(200).json({ user: user })

  }

}
