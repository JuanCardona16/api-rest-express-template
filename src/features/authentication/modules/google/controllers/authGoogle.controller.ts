import { CustomError } from '@/lib';
import { NextFunction, Request, Response } from 'express';
import AuthenticationGoogleServices from '@/features/authentication/modules/google/services/AuthGoogle.service';

class AuthenticationGoogleController {
  async login(req: Request, res: Response, next: NextFunction) {
    const { code } = req.body as { code: string };

    if (!code) return next(CustomError(500, 'Codigo no valido o no encontrado'));

    const response = await AuthenticationGoogleServices.autenticate(code);

    res.status(200).send(response);
  };
}

export default new AuthenticationGoogleController();
