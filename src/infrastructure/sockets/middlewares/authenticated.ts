import { jwtHelpers } from '@/core/security/security';
import { ExtendedError, Socket } from 'socket.io';

export const authenticatedSocket = (socket: Socket, next: (err?: ExtendedError) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.log('❌ Token no proporcionado');
    return next(new Error('No token provided'));
  }

  try {
    const decode = jwtHelpers.verifyToken(token);
    (socket as any).userId = decode?.payload;
    return next();
  } catch (error) {
    return next(new Error('Invalid token'));
  }
};
