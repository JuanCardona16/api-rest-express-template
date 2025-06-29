import CustomResponses, { ApiResponses } from '@/config/responses/CustomResponses';
import { CustomError } from '@/lib';
import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '../model/User.model';

class UserServices {
  constructor(private readonly userRepository: IUserRepository) {}

  async getUserByUuid(uuid: string): Promise<ApiResponses> {
    if (!uuid) throw CustomError(400, 'Bad request');

    const user = await this.userRepository.getUserByUuid(uuid);

    if (!user) throw CustomError(404, 'User not found');

    return CustomResponses.success(user);
  }

  async getUserByEmail(email: string): Promise<ApiResponses> {
    if (!email) throw CustomError(400, 'Bad request');

    const user = await this.userRepository.getUserByEmail(email);

    if (!user) throw CustomError(404, 'User not found');

    return CustomResponses.success(user);
  }

  async updateUser(uuid: string, user: Partial<User>): Promise<ApiResponses> {
    if (!uuid) throw CustomError(400, 'Bad request');

    const updatedUser = await this.userRepository.updateUser(uuid, user);

    if (!updatedUser) throw CustomError(404, 'User not found');

    return CustomResponses.success(updatedUser);
  }

  async deleteUser(uuid: string): Promise<ApiResponses> {
    if (!uuid) throw CustomError(400, 'Bad request');

    const deletedUser = await this.userRepository.deleteUser(uuid);

    if (!deletedUser) throw CustomError(404, 'User not found');

    return CustomResponses.success(deletedUser);
  }

  async getAllUsers(): Promise<ApiResponses> {
    const users = await this.userRepository.getAllUsers();

    if (!users) throw CustomError(404, 'Users not found');

    return CustomResponses.success(users);
  }
}

export default UserServices;
