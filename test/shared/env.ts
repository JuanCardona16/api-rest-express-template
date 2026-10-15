/**
 * Variables de entorno para las pruebas.
 *
 * `dotenv.config()` no sobreescribe variables ya presentes, asi que lo que se
 * define aca gana sobre cualquier `.env` del desarrollador. Sin esto, una
 * prueba de JWT depende del secreto de la maquina de quien la corre.
 */
export const TEST_ENV = {
  NODE_ENV: 'test',
  TOKEN_SECRET_KEY: 'test-token-secret-key-no-usar-en-produccion',
  REFESCH_TOKEN_SECRET_KEY: 'test-refresh-secret-key-no-usar-en-produccion',
  RESEND_KEY: 'test-resend-key',
  CLIENT_GOOGLE_ID: 'test-google-id.apps.googleusercontent.com',
  CLIENT_GOOGLE_SECRET: 'test-google-secret',
  SOCKET_CORS_ORIGIN: 'http://localhost:3000',
  // Sin limite en test: ver core/middleware/rateLimit/limiter.ts
  RATE_LIMIT_MAX: '100000',
} as const;

export type TestEnvKey = keyof typeof TEST_ENV;
