import { NextFunction, Request, Response } from 'express';
import UserServices from '@/features/user/services/user.service';
import { MongoUserRepository } from '@/features/user/repository/mongoUserRepositories';
import { CustomError } from '@/lib';

class UserControllers {
  private userService: UserServices;

  constructor() {
    // Inicializar dependencias
    const userRepository = new MongoUserRepository();
    this.userService = new UserServices(userRepository);
    this.getUserByUuid = this.getUserByUuid.bind(this);
    this.getUserByEmail = this.getUserByEmail.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
  }

  /**
   * GET /users/:uuid
   * Obtener usuario por UUID
   */
  async getUserByUuid(req: Request, _res: Response, _next: NextFunction) {
    const user = (req as any).user;

    return this.userService.getUserByUuid(user.uuid);
  }

  async getUserByEmail(req: Request, _res: Response, next: NextFunction) {
    const { email } = req.params;

    if (!email) {
      return next(CustomError(400, 'Bad request'));
    }

    return this.userService.getUserByEmail(email);
  }

  async updateUser(req: Request, _res: Response, next: NextFunction) {
    const { uuid } = req.params;
    const { user } = req.body;

    if (!uuid || !user) {
      return next(CustomError(400, 'Bad request'));
    }

    return this.userService.updateUser(uuid, user);
  }

  async deleteUser(req: Request, _res: Response, next: NextFunction) {
    const { uuid } = req.params;

    if (!uuid) {
      return next(CustomError(400, 'Bad request'));
    }

    return this.userService.deleteUser(uuid);
  }

  async getAllUsers(_req: Request, _res: Response, _next: NextFunction) {
    return this.userService.getAllUsers();
  }
}

// Exportar una instancia única del controlador
export const userControllers = new UserControllers();
