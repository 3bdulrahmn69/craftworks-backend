import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/environment.js';
import { MessageService } from './message.service.js';
import logger from './logger.js';
import { ISocketUser, ISendMessageRequest } from '../types/message.types.js';
import { IJWTPayload } from '../types/user.types.js';

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ISocketUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) return next(new Error('Authentication token required'));

        const decoded = jwt.verify(token, authConfig.jwtSecret) as IJWTPayload;

        if (!decoded.userId || !decoded.role)
          return next(new Error('Invalid token payload'));

        // Store user info in socket
        socket.data.user = {
          userId: decoded.userId,
          role: decoded.role,
        };

        next();
      } catch (error) {
        logger.error('Socket authentication error', { error });
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const user = socket.data.user;

      logger.info('User connected to socket', {
        userId: user.userId,
        socketId: socket.id,
        role: user.role,
      });

      // Add user to connected users
      this.connectedUsers.set(socket.id, {
        userId: user.userId,
        socketId: socket.id,
        role: user.role,
      });

      // Add socket to user's socket set
      if (!this.userSockets.has(user.userId))
        this.userSockets.set(user.userId, new Set());
      this.userSockets.get(user.userId)!.add(socket.id);

      // Join user to their personal room
      socket.join(`user:${user.userId}`);

      // Auto-join user to their active chats (optional enhancement)
      this.autoJoinUserChats(socket, user.userId);

      // Handle chat events
      this.handleChatEvents(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('User disconnected from socket', {
          userId: user.userId,
          socketId: socket.id,
        });

        // Remove from connected users
        this.connectedUsers.delete(socket.id);

        // Remove from user's socket set
        const userSocketSet = this.userSockets.get(user.userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) this.userSockets.delete(user.userId);
        }
      });
    });
  }

  private handleChatEvents(socket: any): void {
    const user = socket.data.user;

    // Join a chat room
    socket.on('join-chat', async (chatId: string) => {
      try {
        // Verify user is participant in this chat
        const chat = await MessageService.getChatWithDetails(chatId);
        const isParticipant = chat.participants.some(
          (p) => (p._id?.toString() || p.toString()) === user.userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized to join this chat' });
          return;
        }

        // Join the chat room
        socket.join(`chat:${chatId}`);

        // Also ensure user is in their personal room
        socket.join(`user:${user.userId}`);

        // Get room members count for debugging
        const roomSockets = await this.io.in(`chat:${chatId}`).fetchSockets();

        logger.info('User joined chat', {
          userId: user.userId,
          chatId,
          socketId: socket.id,
          roomMembersCount: roomSockets.length,
          roomMembers: roomSockets.map(
            (s) => s.data?.user?.userId || 'unknown'
          ),
        });

        // Send confirmation to the user
        socket.emit('chat-joined', {
          chatId,
          success: true,
          roomMembersCount: roomSockets.length,
        });
      } catch (error) {
        logger.error('Error joining chat', {
          error,
          userId: user.userId,
          chatId,
        });
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Leave a chat room
    socket.on('leave-chat', async (chatId: string) => {
      try {
        // Get room members count before leaving
        const roomSocketsBefore = await this.io
          .in(`chat:${chatId}`)
          .fetchSockets();

        socket.leave(`chat:${chatId}`);

        // Get room members count after leaving
        const roomSocketsAfter = await this.io
          .in(`chat:${chatId}`)
          .fetchSockets();

        logger.info('User left chat', {
          userId: user.userId,
          chatId,
          socketId: socket.id,
          roomMembersBeforeLeave: roomSocketsBefore.length,
          roomMembersAfterLeave: roomSocketsAfter.length,
        });
      } catch (error) {
        logger.error('Error leaving chat', {
          error,
          userId: user.userId,
          chatId,
        });
      }
    });

    // Send message
    socket.on('send-message', async (data: ISendMessageRequest) => {
      try {
        // Validate input
        if (!data.chatId || !data.content || data.content.trim().length === 0) {
          socket.emit('error', {
            message: 'Chat ID and message content are required',
            code: 'INVALID_INPUT',
          });
          return;
        }

        // Verify user is participant in this chat
        const chat = await MessageService.getChatWithDetails(data.chatId);
        const isParticipant = chat.participants.some(
          (p) => (p._id?.toString() || p.toString()) === user.userId
        );

        if (!isParticipant) {
          socket.emit('error', {
            message: 'Not authorized to send message to this chat',
            code: 'UNAUTHORIZED',
          });
          return;
        }

        // Ensure sender is in the chat room
        socket.join(`chat:${data.chatId}`);

        logger.info('Processing message send', {
          chatId: data.chatId,
          senderId: user.userId,
          messageType: data.messageType || 'text',
          contentLength: data.content.length,
        });

        // Send the message and get it with populated sender
        const message = await MessageService.sendMessage(user.userId, {
          chatId: data.chatId,
          messageType: data.messageType || 'text',
          content: data.content.trim(),
        });

        logger.info('Message saved to database', {
          messageId: message._id,
          chatId: data.chatId,
          senderId: user.userId,
        });

        // Get updated chat with latest message info
        const updatedChat = await MessageService.getChatWithDetails(
          data.chatId
        );

        // Verify chat room membership before emitting
        const roomSockets = await this.io
          .in(`chat:${data.chatId}`)
          .fetchSockets();
        const roomMemberIds = roomSockets
          .map((s) => s.data?.user?.userId)
          .filter(Boolean);

        logger.info('Emitting new-message to chat room', {
          room: `chat:${data.chatId}`,
          messageId: message._id,
          roomMembersCount: roomSockets.length,
          roomMemberIds,
          chatParticipants: updatedChat.participants.map(
            (p) => p._id?.toString() || p.toString()
          ),
        });

        // 🔥 EMIT NEW MESSAGE to chat room (for real-time display)
        this.io.to(`chat:${data.chatId}`).emit('new-message', message);

        // 🔄 EMIT CHAT UPDATED to individual user rooms (for chat list updates)
        updatedChat.participants.forEach((participant) => {
          const participantId =
            participant._id?.toString() || participant.toString();
          logger.info('Emitting chat-updated to user', {
            userId: participantId,
            room: `user:${participantId}`,
            lastMessage: updatedChat.lastMessage,
          });

          this.io.to(`user:${participantId}`).emit('chat-updated', updatedChat);
        });

        // Send confirmation to the sender
        socket.emit('message-sent', {
          success: true,
          messageId: message._id,
          timestamp: message.timestamp,
          chatId: data.chatId,
        });

        logger.info('Message sent successfully - all events emitted', {
          messageId: message._id,
          chatId: data.chatId,
          senderId: user.userId,
          roomMembersCount: roomSockets.length,
          eventsEmitted: ['new-message', 'chat-updated', 'message-sent'],
        });
      } catch (error) {
        logger.error('Error sending message via socket', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          userId: user.userId,
          data,
        });

        socket.emit('error', {
          message: 'Failed to send message',
          code: 'SEND_MESSAGE_ERROR',
        });
      }
    });

    // Mark messages as read
    socket.on('mark-messages-read', async (chatId: string) => {
      try {
        const result = await MessageService.markMessagesAsRead(
          chatId,
          user.userId
        );

        if (result.updatedCount > 0) {
          // Notify other participants that messages were read
          socket.to(`chat:${chatId}`).emit('message-read', {
            chatId,
            readBy: user.userId,
          });

          // Update chat for all participants
          const updatedChat = await MessageService.getChatWithDetails(chatId);
          updatedChat.participants.forEach((participant) => {
            const participantId =
              participant._id?.toString() || participant.toString();
            this.io
              .to(`user:${participantId}`)
              .emit('chat-updated', updatedChat);
          });
        }

        logger.info('Messages marked as read via socket', {
          userId: user.userId,
          chatId,
          updatedCount: result.updatedCount,
        });
      } catch (error) {
        logger.error('Error marking messages as read via socket', {
          error,
          userId: user.userId,
          chatId,
        });
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Typing indicators
    socket.on('typing-start', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user-typing', {
        chatId,
        userId: user.userId,
        isTyping: true,
      });
    });

    socket.on('typing-stop', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user-typing', {
        chatId,
        userId: user.userId,
        isTyping: false,
      });
    });
  }

  // Auto-join user to their active chats when they connect
  private async autoJoinUserChats(socket: any, userId: string): Promise<void> {
    try {
      // Get user's active chats
      const userChats = await MessageService.getUserChats(userId, 1, 50); // Get recent chats

      // Join each chat room
      for (const chat of userChats.chats) {
        socket.join(`chat:${chat._id}`);
        logger.info('Auto-joined user to chat', {
          userId,
          chatId: chat._id,
          socketId: socket.id,
        });
      }

      logger.info('Auto-joined user to all active chats', {
        userId,
        socketId: socket.id,
        chatCount: userChats.chats.length,
      });
    } catch (error) {
      logger.error('Error auto-joining user to chats', {
        error,
        userId,
        socketId: socket.id,
      });
    }
  }

  // Public methods for external use
  public notifyNewChat(chatId: string, participantIds: string[]): void {
    logger.info('Notifying participants of new chat', {
      chatId,
      participantIds,
    });

    participantIds.forEach((userId) => {
      // Emit to user's personal room
      this.io.to(`user:${userId}`).emit('chat-updated', { chatId });

      // Also emit a specific new-chat event
      this.io.to(`user:${userId}`).emit('new-chat-notification', {
        chatId,
        message: 'You have a new chat conversation',
      });

      // Automatically join online users to the new chat room
      const userSocketIds = this.userSockets.get(userId);
      if (userSocketIds && userSocketIds.size > 0) {
        userSocketIds.forEach((socketId) => {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.join(`chat:${chatId}`);
            logger.info('Auto-joined user to new chat', {
              userId,
              chatId,
              socketId,
            });
          }
        });
      }
    });
  }

  public notifyMessageUpdate(chatId: string, participantIds: string[]): void {
    logger.info('Notifying participants of message update', {
      chatId,
      participantIds,
    });

    participantIds.forEach((userId) => {
      this.io.to(`user:${userId}`).emit('chat-updated', { chatId });
    });
  }

  public getConnectedUsers(): ISocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public getSocketInstance(): SocketIOServer {
    return this.io;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

let socketService: SocketService;

export const initializeSocket = (server: HttpServer): SocketService => {
  socketService = new SocketService(server);
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) throw new Error('Socket service not initialized');
  return socketService;
};

export default SocketService;
