import { ApiResponse } from '@/config/responses/CustomResponses';
import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

const esApiResponse = (resultado: unknown): resultado is ApiResponse =>
  !!resultado &&
  typeof resultado === 'object' &&
  'success' in resultado &&
  'status' in resultado &&
  typeof (resultado as { status: unknown }).status === 'number';

// Este middleware toma una función (en este caso, un controlador) y la ejecuta dentro de una promesa.
// Si ocurre un error en cualquier parte de la función, catch(next) lo captura y lo pasa al siguiente middleware,
// que en este caso será el manejador de errores global.
//
// Los controladores devuelven la respuesta en lugar de enviarla: asi es este
// middleware quien decide el status, tomado del propio contrato. Antes forzaba
// 200 siempre y hacia imposible responder 201 o 204.
export const asyncHandler =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    // La cadena se devuelve: sin este return el middleware resolvia antes de que
    // `.catch(next)` corriera y los errores nunca llegaban al manejador global.
    Promise.resolve(fn(req, res, next))
      .then((resultado): void => {
        // Si ya enviaste la respuesta en el controlador, no hacer nada
        if (res.headersSent) {
          return;
        }

        if (esApiResponse(resultado)) {
          // 204 no lleva cuerpo: mandarlo es un error en algunos clientes.
          if (resultado.status === 204) {
            res.status(204).end();
            return;
          }

          res.status(resultado.status).json(resultado);
          return;
        }

        // Un controlador que devuelve algo que no es contrato igual tiene que
        // responderse, con la misma forma para que el cliente no tenga que
        // distinguir un caso del otro.
        res.status(200).json({
          success: true,
          data: resultado,
          status: 200,
          timestamp: new Date().toISOString(),
        });
      })
      .catch(next); // Si hay un error, lo pasa al siguiente middleware de error
