// errors/custom-errors.ts
export interface ICustomError {
  status: number;
  message: string;
  code?: string; // ← Código de error específico
}

class SetError extends Error implements ICustomError {
  status: number;
  code?: string;

  constructor(status: number, message?: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, SetError.prototype);
  }
}

// Factory functions específicas
export const CustomError = (status: number, message: string, code?: string): ICustomError => {
  return new SetError(status, message, code);
};

// Errores específicos para diferentes casos
export const ValidationError = (message: string) => CustomError(400, message, 'VALIDATION_ERROR');
export const NotFoundError = (message: string) => CustomError(404, message, 'NOT_FOUND');
export const UnauthorizedError = (message: string) => CustomError(401, message, 'UNAUTHORIZED');
export const DatabaseError = (message: string) => CustomError(500, message, 'INTERNAL_ERROR');
