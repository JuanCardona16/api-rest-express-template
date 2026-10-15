import { CustomError } from '@/lib';
import { NextFunction, Request, Response } from 'express';
import AuthenticationServices from '@/features/authentication/services/auth.service';
import { MongoUserRepository } from '@/features/user/repository/mongoUserRepositories';

class AuthenticationController {
  private authServices: AuthenticationServices;

  constructor() {
    // Inicializar dependencias
    const userRepository = new MongoUserRepository();
    this.authServices = new AuthenticationServices(userRepository);
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
  }

  async register(req: Request, _res: Response, next: NextFunction) {
    const data = req.body as any;

    if (!data) return next(CustomError(500, 'Bad request'));

    // El controlador devuelve la respuesta y asyncHandler decide el status.
    return this.authServices.register(data);
  }

  async login(req: Request, _res: Response, next: NextFunction) {
    const data = req.body as any;

    if (!data || !data.email || !data.password) return next(CustomError(400, 'Bad credentials'));

    return this.authServices.login(data);
  }
}

export const authenticationController = new AuthenticationController();
