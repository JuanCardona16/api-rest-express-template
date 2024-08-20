import { RequestHandler } from "express";
import { AuthServices } from "../services/auth.service.ts";

const authServices = new AuthServices();

export class AuthController {
  
  register: RequestHandler = async (req, res, next) => {
    try {
      const response = authServices.register(req, res, next);
      return response;
    } catch (error) {
      return next(error);
    }
  };

  login: RequestHandler = async (req, res, next) => {
    try {
      const response = authServices.login(req, res, next);
      return response;
    } catch (error) {
      return next(error);
    }
  };
}
