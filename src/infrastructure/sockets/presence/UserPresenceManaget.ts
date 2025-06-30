import { Socket, Server } from 'socket.io';

/**
 * Gestiona la presencia de usuarios y la comunicación en tiempo real a través de conexiones WebSocket
 * Maneja las conexiones de usuarios, desconexiones y difusión de mensajes
 */
export class UserPresenceManager {
  /** Mapa para almacenar las conexiones activas de usuarios con sus instancias de socket */
  private userConnected: Map<string, Socket> = new Map();

  /**
   * Crea una nueva instancia de UserPresenceManager
   * @param io Instancia del servidor Socket.io para gestionar las comunicaciones WebSocket
   */
  constructor(private io: Server) {}

  /**
   * Agrega una nueva conexión de usuario al gestor
   * @param userId Identificador único para el usuario
   * @param socket Instancia de Socket asociada con la conexión del usuario
   * @emits userConnected Transmite la conexión del usuario a todos los clientes
   */
  public addUser(userId: string, socket: Socket): void {
    this.userConnected.set(userId, socket);
    this.io.emit('userConnected', userId);
  }

  /**
   * Elimina una conexión de usuario del gestor
   * @param userId Identificador único del usuario a eliminar
   * @emits userDisconnected Transmite la desconexión del usuario a todos los clientes
   */
  public removeUser(userId: string): void {
    if (this.userConnected.has(userId)) {
      this.userConnected.delete(userId);
      this.io.emit('userDisconnected', userId);
    }
  }

  /**
   * Verifica si un usuario está actualmente conectado
   * @param userId Identificador único del usuario a verificar
   * @returns Verdadero si el usuario está conectado, falso en caso contrario
   */
  public isUserConnected(userId: string): boolean {
    return this.userConnected.has(userId);
  }

  /**
   * Obtiene un array de todos los IDs de usuarios conectados
   * @returns Array de IDs de usuarios actualmente conectados
   */
  public getUsersConnecteds(): String[] {
    return Array.from(this.userConnected.keys());
  }

  /**
   * Recupera la instancia de socket para un usuario específico
   * @param userId Identificador único del usuario
   * @returns Instancia de Socket si el usuario está conectado, undefined en caso contrario
   */
  public getSocketByUserId(userId: string): Socket | undefined {
    return this.userConnected.get(userId);
  }

  /**
   * Emite un evento a un usuario específico
   * @param userId Identificador único del usuario objetivo
   * @param event Nombre del evento a emitir
   * @param data Datos a enviar con el evento
   */
  public emitToUser(userId: string, event: string, data: any): void {
    const socket = this.userConnected.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * Transmite un evento a todos los usuarios conectados
   * @param event Nombre del evento a emitir
   * @param data Datos a enviar con el evento
   */
  public emitToAllUsers(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
