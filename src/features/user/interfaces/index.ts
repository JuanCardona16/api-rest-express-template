import { RegisterRequestData } from '@/features/authentication/interfaces';
import { AuthMethods, User } from './user.types';

export * from './user.types';

/**
 * Contrato de acceso a datos de usuarios.
 *
 * Es un puerto, no una implementación: dice QUE se puede hacer, no COMO. La
 * implementación con mongoose vive en infrastructure/mongoDb y se inyecta por
 * constructor. Ningún servicio debe importar el modelo de mongoose directamente;
 * si lo hace, la frontera de dependencias se filtró.
 */
export interface IUserRepository {
  getUserByUuid(uuid: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: RegisterRequestData): Promise<User>;
  updateUser(uuid: string, user: Partial<User>): Promise<User | null>;
  deleteUser(uuid: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  getPasswordByEmail(email: string): Promise<{ uuid: string; password: string } | null>;
}

export interface UpdateUserData extends Partial<Omit<User, 'uuid'>> {
  authenticationMethod?: AuthMethods;
}
