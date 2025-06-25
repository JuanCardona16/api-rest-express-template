import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

export const GlobalHandleError: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode: number = error.status || 500;
  const message: string = error.message || 'An error occurred';
  const code: string = error.code || 'INTERNAL_ERROR';

  // Log del error para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });
  }

  // Respuesta consistente
  res.status(statusCode).json({
    success: false, // ← Siempre false para errores
    error: {
      message,
      code,
      status: statusCode,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }), // Stack solo en dev
    },
  });
};
