import { AuthMethods } from '@/features/user/interfaces/user.types';

export type LoginRequestData = {
  email: string;
  password: string;
};

export type RegisterRequestData = LoginRequestData & {
  username: string;
  authenticationMethod: AuthMethods;
};
