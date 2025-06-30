import { createServer } from 'node:http';
import app from '../core/app';
import { PORT } from '@/config/env/enviroments';
import { SocketManager } from '@/infrastructure/sockets/config/socket.config';

// Creamos el servidor HTTP
const httpServer = createServer(app);

// Iniciamos sockets
const socketManager = SocketManager.getInstance();
socketManager.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor REST+WebSocket listening on ${PORT} -> http://localhost:${PORT}`);
  console.log('Control + C por stopping the servive');
});
