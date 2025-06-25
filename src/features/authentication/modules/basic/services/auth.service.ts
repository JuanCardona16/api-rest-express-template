import CustomApiResponses, { ApiResponses } from '@/config/responses/CustomResponses';
import { jwtHelpers } from '@/core/security/security';
import { IUserRepository } from '@/features/user/interfaces/IUserRepository';
import { CustomError } from '@/lib';
import PasswordHelpers from '../../../../../lib/Passwords/PasswordHelpers';
import { LoginRequestData, RegisterRequestData } from '../types';

class AuthenticationServices {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(requestData: RegisterRequestData): Promise<ApiResponses> {
    if (!requestData) throw CustomError(400, 'Bad Request');

    const newUser = await this.userRepository.createUser(requestData);

    const token = jwtHelpers.generateToken<string>({ payload: newUser.uuid }, '2d');

    return CustomApiResponses.success(token);
  }

  async login(requestData: LoginRequestData): Promise<ApiResponses> {
    if (!requestData) throw CustomError(400, 'Bad Request');

    const user = await this.userRepository.getPasswordByEmail(requestData.email);

    if (!user) throw CustomError(404, 'User not found');

    if (!PasswordHelpers.compare(requestData.password, user.password))
      throw CustomError(403, 'Password incorrect');

    const token = jwtHelpers.generateToken<string>({ payload: user.uuid }, '2d');

    return CustomApiResponses.success(token);
  }
}

export default AuthenticationServices;
