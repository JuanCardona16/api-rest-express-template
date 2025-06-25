import UserModel from '@/infrastructure/mongoDb/Schemas/user/UserModel';
import { CustomError } from '@/lib';
import { Model } from 'mongoose';
import { IUserRepository } from '../interfaces/IUserRepository';
import { RegisterRequestData } from '@/features/authentication/modules/basic/types';
import { User } from '../model/User.model';

// El Repository solo retorna datos, el Service maneja la lógica
export class MongoUserRepository implements IUserRepository {
  constructor(private readonly userModel: Model<User> = UserModel) {}

  async getUserByUuid(uuid: string): Promise<User | null> {
    try {
      const user = await this.userModel.findOne({ uuid }).select('-password -_id').lean().exec();
      return user;
    } catch (error) {
      throw CustomError(500, 'Internal server error');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userModel.findOne({ email }).select('-password -_id').lean().exec();
      return user;
    } catch (error) {
      throw CustomError(500, 'Internal server error');
    }
  }

  async createUser(user: RegisterRequestData): Promise<User> {
    try {
      const newUser = await this.userModel.create(user);
      return newUser;
    } catch (error) {
      throw CustomError(500, 'Internal server error');
    }
  }

  async updateUser(uuid: string, user: Partial<User>): Promise<User | null> {
    try {
      const updatedUser = await this.userModel
        .findOneAndUpdate({ uuid }, user, { new: true })
        .lean()
        .exec();
      return updatedUser;
    } catch (error) {
      throw CustomError(500, 'Internal server error');
    }
  }

  async deleteUser(uuid: string): Promise<User | null> {
    try {
      const deletedUser = await this.userModel.findOneAndDelete({ uuid }).lean().exec();
      return deletedUser;
    } catch (error) {
      throw CustomError(500, 'Internal server error');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.userModel.find().select('-password -_id').lean().exec();
      return users;
    } catch (error) {
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
