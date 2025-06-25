import { AuthMethods } from "@/features/user/model/User.model";

export type LoginRequestData = {
  email: string;
  password: string;
};

export type RegisterRequestData = LoginRequestData & {
  username: string;
  authenticationMethod: AuthMethods;
};
