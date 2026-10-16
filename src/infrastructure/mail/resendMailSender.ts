import { Resend } from 'resend';
import { MailSender } from '@/features/authentication/interfaces';

/**
 * Adaptador de Resend para el puerto MailSender.
 *
 * La clave se lee al construir, no al importar el módulo: antes el servicio era
 * un singleton a nivel de módulo que lanzaba si faltaba RESEND_KEY, de modo que
 * importar el archivo sin esa variable-rompía la aplicación entera.
 */
export class ResendMailSender implements MailSender {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string = 'onboarding@resend.dev') {
    this.resend = new Resend(apiKey);
    this.from = from;
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: this.from,
      to: [email],
      subject: 'Cambio de contraseña',
      html: `<p>Tu código para recuperar la contraseña es <strong>${code}</strong>. Expira en 5 minutos.</p>`,
    });
  }
}
