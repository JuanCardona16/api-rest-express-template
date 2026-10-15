/**
 * Contrato de respuesta de la API.
 *
 * Un solo tipo gobierna tanto el exito como el error, y ambos viajan con el
 * status HTTP que corresponde. Antes el status lo elegia `asyncHandler` a
 * ciegas (siempre 200) y el error anidaba el status dentro de `error`, con lo
 * cual el mismo dato vivia en dos lugares distintos segun fuera exito o fallo.
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  status: number;
  timestamp: string;
}

export interface ApiErrorDetail {
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  status: number;
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

class CustomApiResponses {
  /**
   * @param status Codigo HTTP que accompanya a la respuesta. `201` para
   *   recursos creados, `204` para operaciones sin contenido.
   */
  success = <T>(data: T, status = 200): ApiSuccessResponse<T> => ({
    success: true,
    data,
    status,
    timestamp: new Date().toISOString(),
  });

  /** Sin cuerpo: para 204 y operaciones donde la respuesta no lleva datos. */
  noContent = (): ApiSuccessResponse<undefined> => ({
    success: true,
    data: undefined,
    status: 204,
    timestamp: new Date().toISOString(),
  });

  error = (message: string, status = 500, code = 'INTERNAL_ERROR'): ApiErrorResponse => ({
    success: false,
    error: { message, code },
    status,
    timestamp: new Date().toISOString(),
  });
}

export default new CustomApiResponses();
