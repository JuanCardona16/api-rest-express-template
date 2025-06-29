import { NextFunction, Request, Response } from 'express';
import UserServices from '../services/user.service';
import { MongoUserRepository } from '../repository/mongoUserRepositories';
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
  async getUserByUuid(req: Request, res: Response, _next: NextFunction) {
    const user = (req as any).user;

    const response = await this.userService.getUserByUuid(user.uuid);

    res.status(200).json(response);
  }

  async getUserByEmail(req: Request, res: Response, next: NextFunction) {
    const { email } = req.params;

    if (!email) {
      return next(CustomError(400, 'Bad request'));
    }

    const response = await this.userService.getUserByEmail(email);

    res.status(200).json(response);
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    const { uuid } = req.params;
    const { user } = req.body;

    console.log("uuid: ", uuid);
    console.log("user: ", user);

    if (!uuid || !user) {
      return next(CustomError(400, 'Bad request'));
    }

    const response = await this.userService.updateUser(uuid, user);

    res.status(200).json(response);
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    const { uuid } = req.params;

    if (!uuid) {
      return next(CustomError(400, 'Bad request'));
    }

    const response = await this.userService.deleteUser(uuid);

    res.status(200).json(response);
  }

  async getAllUsers(_req: Request, res: Response, _next: NextFunction) {
    const response = await this.userService.getAllUsers();
    res.status(200).json(response);
  }
}

// Exportar una instancia única del controlador
export const userControllers = new UserControllers();
