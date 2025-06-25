import { RegisterRequestData } from '@/features/authentication/modules/basic/types';
import { User } from '../model/User.model';

// Esto es como un "contrato" - dice QUÉ hacer, no CÓMO
export interface IUserRepository {
  getUserByUuid(uuid: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: RegisterRequestData): Promise<User>;
  updateUser(uuid: string, user: Partial<User>): Promise<User | null>;
  deleteUser(uuid: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  getPasswordByEmail(email: string): Promise<{ uuid: string; password: string } | null>;
}
