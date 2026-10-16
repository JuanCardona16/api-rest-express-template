import CustomApiResponses, { ApiSuccessResponse } from '@/config/responses/CustomResponses';
import { CLIENT_GOOGLE_ID, CLIENT_GOOGLE_SECRET } from '@/config/env/enviroments';
import { client } from '@/features/authentication/config/authGoogle.config';
import { IUserRepository } from '@/features/user/interfaces';
import { AuthMethods } from '@/features/user/interfaces/user.types';
import { CustomError } from '@/lib';
import { jwtHelpers } from '@/lib/Jwt';
import axios from 'axios';

/**
 * Autenticación con Google.
 *
 * El acceso a datos va por el puerto IUserRepository, igual que el login local.
 * Antes importaba el modelo de mongoose directamente, lo que rompía la frontera
 * de dependencias y hacía imposible probarlo sin una base de datos.
 */
class AuthenticationGoogleServices {
  constructor(private readonly userRepository: IUserRepository) {}

  private verifyGoogle = async (idToken: string) => {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: CLIENT_GOOGLE_ID,
      });

      const payload = ticket.getPayload();

      if (!payload?.email) throw new Error('El token de Google no trae email.');

      return {
        email: payload.email,
        name: payload.given_name,
        lastname: payload.family_name,
        photo: payload.picture,
      };
    } catch {
      throw CustomError(401, 'Could not verify the Google token', 'INVALID_GOOGLE_TOKEN');
    }
  };

  private exchangeCodeForTokens = async (code: string): Promise<string> => {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: CLIENT_GOOGLE_ID,
        client_secret: CLIENT_GOOGLE_SECRET,
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code',
      });

      const idToken = response.data?.id_token;

      if (!idToken) throw new Error('Google no devolvio id_token.');

      return idToken;
    } catch {
      throw CustomError(401, 'Google rejected the authorization code', 'INVALID_GOOGLE_CODE');
    }
  };

  public login = async (code: string): Promise<ApiSuccessResponse<string>> => {
    const idToken = await this.exchangeCodeForTokens(code);
    const userData = await this.verifyGoogle(idToken);

    const user = await this.userRepository.getUserByEmail(userData.email);

    // El email ya está con autenticación local: un atacante podría reutilizar su
    // cuenta. Se rechaza en vez de devolver un token.
    if (user && user.authenticationMethod !== AuthMethods.GOOGLE) {
      throw CustomError(
        409,
        'This email is already registered with another authentication method',
        'CONFLICT',
      );
    }

    const usuario =
      user ??
      (await this.userRepository.createUser({
        username: `${userData.name ?? ''} ${userData.lastname ?? ''}`.trim() || 'google-user',
        email: userData.email,
        authenticationMethod: AuthMethods.GOOGLE,
      } as Parameters<IUserRepository['createUser']>[0]));

    const token = jwtHelpers.generateToken<string>({ payload: usuario.uuid }, '1d');

    return CustomApiResponses.success(token);
  };
}

export default AuthenticationGoogleServices;
