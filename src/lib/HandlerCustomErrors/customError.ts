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
    this.name = 'SetError';
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, SetError.prototype);
  }
}

/**
 * Crea un error con status HTTP.
 *
 * La firma declara `SetError` y no `ICustomError`: SetError extiende Error de
 * verdad, y los hooks de mongoose exigen un Error. Antes la factory devolvia el
 * tipo de la interfaz, que no es asignable a Error, y `next(CustomError(...))`
 * no compilaba sin un cast.
 */
export const CustomError = (status: number, message: string, code?: string): SetError => {
  return new SetError(status, message, code);
};

// Errores específicos para diferentes casos
export const ValidationError = (message: string): SetError =>
  CustomError(400, message, 'VALIDATION_ERROR');
export const NotFoundError = (message: string): SetError => CustomError(404, message, 'NOT_FOUND');
export const UnauthorizedError = (message: string): SetError =>
  CustomError(401, message, 'UNAUTHORIZED');
export const DatabaseError = (message: string): SetError =>
  CustomError(500, message, 'INTERNAL_ERROR');
