import { Response, Request, NextFunction } from 'express';

// Este middleware toma una función (en este caso, un controlador) y la ejecuta dentro de una promesa.
// Si ocurre un error en cualquier parte de la función, catch(next) lo captura y lo pasa al siguiente middleware,
// que en este caso será el manejador de errores global.
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next))
    .then((result) => {
      // Si ya enviaste la respuesta en el controlador, no hacer nada
      if (res.headersSent) {
        return;
      }

      // Si el resultado es tu ApiResponses personalizado
      if (result && typeof result === 'object' && 'success' in result) {
        return res.status(200).json(result);
      }

      // Para resultados simples
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    })
    .catch(next); // Si hay un error, lo pasa al siguiente middleware de error
};
