import CustomApiResponses, { ApiSuccessResponse } from '@/config/responses/CustomResponses';
import { jwtHelpers } from '@/lib/Jwt';
import { IUserRepository } from '@/features/user/interfaces';
import { CustomError } from '@/lib';
import PasswordHelpers from '@/lib/Passwords/PasswordHelpers';
import { LoginRequestData, RegisterRequestData } from '@/features/authentication/interfaces';
import passwordVerificationCache from '@/features/authentication/services/passwordVerificationCache';

class AuthenticationServices {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationCache = passwordVerificationCache,
  ) {}

  async register(requestData: RegisterRequestData): Promise<ApiSuccessResponse<string>> {
    if (!requestData) throw CustomError(400, 'Bad Request');

    const newUser = await this.userRepository.createUser(requestData);

    const token = jwtHelpers.generateToken<string>({ payload: newUser.uuid }, '2d');

    return CustomApiResponses.success(token);
  }

  /**
   * Autentica al usuario.
   *
   * Un email inexistente y una contraseña incorrecta responden EXACTAMENTE lo
   * mismo: status, mensaje y código. Antes eran 404 'User not found' y 403
   * 'Password incorrect', dos respuestas distintas que confirmaban si una cuenta
   * estaba registrada y permitían enumerar emails con un solo login.
   */
  async login(requestData: LoginRequestData): Promise<ApiSuccessResponse<string>> {
    if (!requestData) throw CustomError(400, 'Bad Request');

    const credencialesInvalidas = () =>
      CustomError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');

    const user = await this.userRepository.getPasswordByEmail(requestData.email);

    if (!user) throw credencialesInvalidas();

    // Cache del resultado de la comparacion, no de la sesion: `authorize` solo
    // verifica la firma del JWT, asi que bcrypt solo corre en este endpoint. Un
    // login repetido dentro de la ventana evita el hasheo. Si el hash de la base
    // no coincide con lo cacheado, la contrasena cambio y se hashea igual.
    const yaVerificado = await this.verificationCache.wasRecentlyVerified(
      user.uuid,
      requestData.password,
      user.password,
    );

    if (!yaVerificado && !(await PasswordHelpers.compare(requestData.password, user.password)))
      throw credencialesInvalidas();

    if (!yaVerificado)
      await this.verificationCache.remember(user.uuid, requestData.password, user.password);

    const token = jwtHelpers.generateToken<string>({ payload: user.uuid }, '2d');

    return CustomApiResponses.success(token);
  }
}

export default AuthenticationServices;
