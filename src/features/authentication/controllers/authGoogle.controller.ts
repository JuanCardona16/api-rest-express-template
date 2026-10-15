import AuthenticationGoogleServices from '@/features/authentication/services/authGoogle.service';
import { MongoUserRepository } from '@/features/user/repository/mongoUserRepositories';
import { Request } from 'express';

class GoogleAuthController {
  login = async (req: Request) => {
    const { code } = req.body as { code: string };

    const servicio = new AuthenticationGoogleServices(new MongoUserRepository());

    return servicio.login(code);
  };
}

export const AuthenticationGoogleController = new GoogleAuthController();
