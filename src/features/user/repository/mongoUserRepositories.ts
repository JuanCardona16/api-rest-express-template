import UserModel from '@/infrastructure/mongoDb/Schemas/user/UserModel';
import { CustomError } from '@/lib';
import { Model } from 'mongoose';
import { IUserRepository } from '@/features/user/interfaces';
import { RegisterRequestData } from '@/features/authentication/interfaces';
import { User } from '@/features/user/interfaces';

/**
 * MongoDB lanza un error de clave duplicada con code 11000 cuando un indice
 * unico no se puede cumplir. Es la unica señal que distingue "el email ya
 * existe" de una falla real de la base.
 */
const DUPLICATE_KEY_ERROR = 11000;

const esClaveDuplicada = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === DUPLICATE_KEY_ERROR;

// El Repository solo retorna datos, el Service maneja la lógica
export class MongoUserRepository implements IUserRepository {
  constructor(private readonly userModel: Model<User> = UserModel) {}

  async getUserByUuid(uuid: string): Promise<User | null> {
    try {
      const user = await this.userModel.findOne({ uuid }).select('-password -_id').lean().exec();
      return user;
    } catch {
      throw CustomError(500, 'Internal server error');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userModel.findOne({ email }).select('-password -_id').lean().exec();
      return user;
    } catch {
      throw CustomError(500, 'Internal server error');
    }
  }

  async createUser(user: RegisterRequestData): Promise<User> {
    try {
      const newUser = await this.userModel.create(user);
      return newUser;
    } catch (error) {
      // El indice unico de mongoose lanza cuando el email ya existe. Eso no es
      // una falla del servidor sino input del cliente: responder 500 hacia que la
      // API se haga culpable de algo que el usuario hizo bien.
      if (esClaveDuplicada(error)) throw CustomError(409, 'Email already in use', 'CONFLICT');

      throw CustomError(500, 'Internal server error');
    }
  }

  async updateUser(uuid: string, user: Partial<User>): Promise<User | null> {
    try {
      const updatedUser = await this.userModel
        .findOneAndUpdate({ uuid }, user, { new: true })
        .select('-password -_id')
        .lean()
        .exec();
      return updatedUser;
    } catch {
      throw CustomError(500, 'Internal server error');
    }
  }

  async deleteUser(uuid: string): Promise<User | null> {
    try {
      const deletedUser = await this.userModel
        .findOneAndDelete({ uuid })
        .select('-password -_id')
        .lean()
        .exec();
      return deletedUser;
    } catch {
      throw CustomError(500, 'Internal server error');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.userModel.find().select('-password -_id').lean().exec();
      return users;
    } catch {
      throw CustomError(500, 'Internal server error');
    }
  }

  async getPasswordByEmail(email: string): Promise<{ uuid: string; password: string } | null> {
    try {
      const user = await this.userModel
        .findOne({ email })
        .select('password uuid -_id')
        .lean()
        .exec();
      return user || null;
    } catch (error) {
      console.log(error);
      throw CustomError(500, 'Internal server error');
    }
  }
}
