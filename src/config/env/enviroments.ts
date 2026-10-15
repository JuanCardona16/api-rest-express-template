import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 3000;
export const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY as string;
export const REFESCH_TOKEN_SECRET_KEY = process.env.REFESCH_TOKEN_SECRET_KEY as string;
export const DATABASE_URL = process.env.DATABASE_URL as string;

// Email enviroments
export const RESEND_KEY = process.env.RESEND_KEY as string;

// Google enviroments
export const CLIENT_GOOGLE_ID = process.env.CLIENT_GOOGLE_ID!;
export const CLIENT_GOOGLE_SECRET = process.env.CLIENT_GOOGLE_SECRET!;

// Socket.IO: lista de origenes permitidos separados por coma.
// Evita el origen unico '*' combinado con credentials, que es una contradiccion de CORS.
export const SOCKET_CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || `http://localhost:${PORT}`;

// Limite de solicitudes. En test se desactiva para que las suites no choquen con 429.
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 10);
export const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);