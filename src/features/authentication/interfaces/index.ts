import { AuthMethods } from '@/features/user/interfaces/user.types';
import { z } from 'zod';

export type LoginRequestData = {
  email: string;
  password: string;
};

export type RegisterRequestData = LoginRequestData & {
  username: string;
  authenticationMethod: AuthMethods;
};

/**
 * Puerto de envío de correo.
 *
 * Existe para que el servicio de recuperación de contraseña no dependa de Resend
 * directamente: las pruebas inyectan un doble y ningún correo sale de la máquina.
 */
export interface MailSender {
  sendPasswordResetCode(email: string, code: string): Promise<void>;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ChangePasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

/** Evita el import circular entre los tipos de auth y los de usuario. */
export const authMethodsFromZod = z.enum(['BASIC', 'GOOGLE']);
