import { RegisterRequestData } from '@/features/authentication/interfaces';
import { AuthMethods, IUserRepository, User } from '@/features/user/interfaces';
import { vi } from 'vitest';

export const usuarioDePrueba = (overrides: Partial<User> = {}): User => ({
  uuid: '2f1c9a8e-5b3d-4c7a-9e1f-7a6b5c4d3e2f',
  username: 'juan',
  email: 'juan@example.com',
  password: 'Password1!',
  authenticationMethod: AuthMethods.BASIC,
  ...overrides,
});

export const datosDeRegistro = (overrides: Partial<RegisterRequestData> = {}) => ({
  username: 'juan',
  email: 'juan@example.com',
  password: 'Password1!',
  authenticationMethod: AuthMethods.BASIC,
  ...overrides,
});

/**
 * Doble de prueba del puerto IUserRepository.
 *
 * El repositorio ya es una interfaz, asi que los servicios se prueban sin base
 * de datos y sin Docker. Si algun dia un servicio importa el modelo de mongoose
 * directo, este doble deja de alcanzar y el fallo lo delata.
 */
export const crearRepositorioDeUsuariosMock = () => ({
  getUserByUuid: vi.fn(async (_uuid: string): Promise<User | null> => null),
  getUserByEmail: vi.fn(async (_email: string): Promise<User | null> => null),
  createUser: vi.fn(async (_user: RegisterRequestData): Promise<User> => usuarioDePrueba()),
  updateUser: vi.fn(async (_uuid: string, _user: Partial<User>): Promise<User | null> => null),
  deleteUser: vi.fn(async (_uuid: string): Promise<User | null> => null),
  getAllUsers: vi.fn(async (): Promise<User[]> => []),
  getPasswordByEmail: vi.fn(
    async (_email: string): Promise<{ uuid: string; password: string } | null> => null,
  ),
});

export type RepositorioDeUsuariosMock = ReturnType<typeof crearRepositorioDeUsuariosMock>;

/** El doble cumple el contrato; esto falla al compilar si el contrato cambia. */
export const comoRepositorio = (mock: RepositorioDeUsuariosMock): IUserRepository => mock;
