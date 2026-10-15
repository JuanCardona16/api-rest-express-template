import CustomApiResponses, { ApiSuccessResponse } from '@/config/responses/CustomResponses';
import {
  ChangePasswordRequest,
  MailSender,
  VerifyCodeRequest,
} from '@/features/authentication/interfaces';
import InMemoryCodeSecurityService from '@/features/authentication/helpers/InMemoryCodeSecurityService';
import { IUserRepository } from '@/features/user/interfaces';
import { CustomError } from '@/lib';
import PasswordHelpers from '@/lib/Passwords/PasswordHelpers';
import { jwtHelpers } from '@/lib/Jwt';

/**
 * Recuperación de contraseña.
 *
 * El repositorio y el cliente de correo llegan por constructor. Antes este
 * servicio escribía contra el modelo de mongoose, saltándose el puerto, y el
 * controlador era un singleton con `this.key = email`: dos personas recuperando
 * al mismo tiempo se pisaban la clave.
 */
class ChangePasswordService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly mailSender: MailSender,
  ) {}

  /**
   * Genera y envía un código.
   *
   * Responde siempre lo mismo, exista o no el email: un endpoint que distingue
   * los dos casos es un oráculo de qué correos están registrados.
   */
  public sendCodeForEmail = async (email: string): Promise<ApiSuccessResponse<string>> => {
    const codigo = InMemoryCodeSecurityService.createCode(email);

    try {
      await this.mailSender.sendPasswordResetCode(email, codigo);
    } catch {
      // Un fallo del proveedor de correo no puede convertirse en un 500 que le
      // diga al usuario que su cuenta existe y que el problema es nuestro.
      InMemoryCodeSecurityService.clear();
    }

    return CustomApiResponses.success('If the email exists, a code has been sent');
  };

  /** Verifica el código y devuelve un token de un solo uso para cambiar la clave. */
  public verifyCode = async ({
    email,
    code,
  }: VerifyCodeRequest): Promise<ApiSuccessResponse<{ token: string }>> => {
    const esValido = InMemoryCodeSecurityService.verifyCode(email, code);

    if (!esValido) {
      throw CustomError(400, 'The code is incorrect or expired', 'INVALID_CODE');
    }

    const token = jwtHelpers.generateToken<string>({ payload: email }, '15m');

    return CustomApiResponses.success({ token });
  };

  public changePassword = async ({
    email,
    token,
    newPassword,
  }: ChangePasswordRequest): Promise<ApiSuccessResponse<string>> => {
    const payload = jwtHelpers.verifyToken<string>(token);

    // El token lleva el email al que se autorizó el cambio: usarlo impide que
    // quien tenga un código pueda cambiarle la clave a otra cuenta.
    if (!payload?.payload || payload.payload !== email) {
      throw CustomError(401, 'Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    const hashedPassword = PasswordHelpers.generateHashing(newPassword, 12);

    const actualizado = await this.userRepository.updatePasswordByEmail(email, hashedPassword);

    if (!actualizado) {
      throw CustomError(404, 'User not found', 'NOT_FOUND');
    }

    return CustomApiResponses.success('Password updated successfully');
  };
}

export default ChangePasswordService;
