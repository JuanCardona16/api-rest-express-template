import { NODE_ENV, RESEND_KEY } from '@/config/env/enviroments';
import { MailSender } from '@/features/authentication/interfaces';
import ChangePasswordService from '@/features/authentication/services/changePassword.service';
import { MongoUserRepository } from '@/features/user/repository/mongoUserRepositories';
import { ResendMailSender } from '@/infrastructure/mail/resendMailSender';
import { Request } from 'express';

const SIN_ENVIO: MailSender = { sendPasswordResetCode: async () => undefined };

/**
 * El email se pide siempre y se responde siempre igual. La UI usa la respuesta
 * para avisar "te enviamos un código", no para saber si la cuenta existe.
 *
 * En test el envío es un no-op a propósito: las pruebas no deben salir a la red
 * ni depender de que Resend esté disponible. El código se lee del helper.
 */
const construirServicio = (): ChangePasswordService => {
  const mailSender: MailSender =
    NODE_ENV === 'test' || !RESEND_KEY ? SIN_ENVIO : new ResendMailSender(RESEND_KEY);

  return new ChangePasswordService(new MongoUserRepository(), mailSender);
};

class ChangePasswordController {
  sendCode = async (req: Request) => {
    const { email } = req.body as { email: string };

    return construirServicio().sendCodeForEmail(email);
  };

  verifyCode = async (req: Request) => {
    const { email, code } = req.body as { email: string; code: string };

    return construirServicio().verifyCode({ email, code });
  };

  changePassword = async (req: Request) => {
    const { email, token, newPassword } = req.body as {
      email: string;
      token: string;
      newPassword: string;
    };

    return construirServicio().changePassword({ email, token, newPassword });
  };
}

export default new ChangePasswordController();
