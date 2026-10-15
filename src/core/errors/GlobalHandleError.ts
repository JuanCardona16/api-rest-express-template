import { ApiErrorResponse } from '@/config/responses/CustomResponses';
import { ErrorRequestHandler } from 'express';

/**
 * Manejador global de errores.
 *
 * Un error sin `status` es un 500 y un error sin `code` es INTERNAL_ERROR: nunca
 * se escapa una respuesta fuera del contrato.
 */
export const GlobalHandleError: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode: number = error.status || 500;
  const message: string = error.message || 'An error occurred';
  const code: string = error.code || 'INTERNAL_ERROR';

  // Log del error para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
  }

  const response: ApiErrorResponse = {
    success: false,
    error: { message, code },
    status: statusCode,
    timestamp: new Date().toISOString(),
  };

  // El stack viaja dentro del error y solo en desarrollo.
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.error = { message, code, ...({ stack: error.stack } as Record<string, string>) };
  }

  res.status(statusCode).json(response);
};
