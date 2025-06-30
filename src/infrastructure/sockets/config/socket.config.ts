import { Server as HttpServer } from 'node:http';
import { Server as ServerSocketIO, Socket } from 'socket.io';
import { authenticatedSocket } from '../middlewares/authenticated';
import { UserPresenceManager } from '../presence/UserPresenceManaget';

declare module 'socket.io' {
  interface Socket {
    userId: string;
  }
}

export class SocketManager {
  private static instance: SocketManager;
  private io: ServerSocketIO | null = null;
  private presenceManager: UserPresenceManager | null = null;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public initialize(httpServer: HttpServer): ServerSocketIO {
    this.io = new ServerSocketIO(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });
    this.presenceManager = new UserPresenceManager(this.io);
    this.setupSocketEvents();
    return this.io;
  }

  private setupSocketEvents(): void {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }

    // Middleware de autenticacion socket
    this.io.use(authenticatedSocket);

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Cliente conectado: ${socket.userId}`);

      this.presenceManager!.addUser(socket.userId, socket);

      socket.on('chat message', (message: string) => {
        console.log(`📨 Mensaje recibido de ${socket.userId}: ${message}`);
        this.presenceManager!.emitToUser(socket.userId, 'message', {
          userId: socket.userId,
          message: "Mensaje recibido desde el servidor de Node.js y Express! 😀",
        });
      });

      socket.on('disconnect', () => {
        if (socket.userId) {
          this.presenceManager!.removeUser(socket.userId);
          console.log(`🔌 Usuario desconectado: ${socket.userId}`);
        }
      });
    })
  }
}
