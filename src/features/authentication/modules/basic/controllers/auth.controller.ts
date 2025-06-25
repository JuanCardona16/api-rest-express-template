import { CustomError } from '@/lib';
import { NextFunction, Request, Response } from 'express';
import AuthenticationServices from '@/features/authentication/modules/basic/services/auth.service';
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

  async register(req: Request, res: Response, next: NextFunction) {
    const data = req.body as any;

    if (!data) next(CustomError(500, 'Bad request'));

    const response = await this.authServices.register(data);

    res.status(200).send(response);
  }

  async login(req: Request, res: Response, next: NextFunction) {
    const data = req.body as any;

    if (!data || !data.email || !data.password) next(CustomError(400, 'Bad credentials'));

    const response = await this.authServices.login(data);

    res.status(200).send(response);
  }
}

export const authenticationController = new AuthenticationController();
