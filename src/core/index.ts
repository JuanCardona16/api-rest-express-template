import { PORT } from '@/config/env/enviroments';
import MongoHelpers from '@/infrastructure/mongoDb/lib/MongoHelpers';
import { SocketManager } from '@/infrastructure/sockets/config/socket.config';
import { createServer } from 'node:http';
import { createApp } from '@/core/app';

// Punto de entrada: unico lugar que conecta servicios externos y abre el puerto.
// La construccion de la app vive en `app.ts` y no toca la base de datos.
MongoHelpers.createDatabaseConnection(process.env.DATABASE_URL as string);

const app = createApp();

// Creamos el servidor HTTP
const httpServer = createServer(app);

// Iniciamos sockets
const socketManager = SocketManager.getInstance();
socketManager.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor REST+WebSocket listening on ${PORT} -> http://localhost:${PORT}`);
  console.log('Control + C por stopping the servive');
});
