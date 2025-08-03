import { Response } from 'express';
import { MessageService } from '../services/message.service.js';
import { getSocketService } from '../services/socket.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import {
  ICreateChatRequest,
  ISendMessageRequest,
} from '../types/message.types.js';
import logger from '../services/logger.js';
import { PaginationHelper } from '../utils/paginationHelper.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class MessageController {
  /**
   * Create a new chat (Client to Craftsman only)
   */
  static async createChat(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const data: ICreateChatRequest = req.body;

      // Enforce role restriction: only clients can create chats
      if (userRole !== 'client') {
        ApiResponse.forbidden(
          res,
          'Only clients can initiate chats with craftsmen'
        );
        return;
      }

      if (!data.craftsmanId) {
        ApiResponse.badRequest(res, 'Craftsman ID is required');
        return;
      }

      if (data.craftsmanId === userId) {
        ApiResponse.badRequest(res, 'Cannot create chat with yourself');
        return;
      }

      const chat = await MessageService.createChat(userId, data);

      // Notify both participants via socket
      const socketService = getSocketService();
      socketService.notifyNewChat(chat._id, [userId, data.craftsmanId]);

      ApiResponse.success(res, chat, 'Chat created successfully', 201);
    } catch (error) {
      logger.error('Error in createChat controller', {
        error,
        userId: req.user?.userId,
        role: req.user?.role,
      });

      if (error instanceof Error) {
        if (
          error.message.includes('Only clients') ||
          error.message.includes('craftsmen')
        ) {
          ApiResponse.forbidden(res, error.message);
          return;
        }
        if (error.message.includes('not found')) {
          ApiResponse.notFound(res, error.message);
          return;
        }
      }

      ApiResponse.error(res, 'Failed to create chat', 500);
    }
  }

  /**
   * Get user's chats
   */
  static async getUserChats(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { page, limit } = PaginationHelper.parseParams(req.query);

      const result = await MessageService.getUserChats(userId, page, limit);

      ApiResponse.success(res, result, 'Chats retrieved successfully');
    } catch (error) {
      logger.error('Error in getUserChats controller', {
        error,
        userId: req.user?.userId,
      });
      ApiResponse.error(res, 'Failed to retrieve chats', 500);
    }
  }

  /**
   * Get chat details
   */
  static async getChatDetails(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { chatId } = req.params;

      if (!chatId) {
        ApiResponse.badRequest(res, 'Chat ID is required');
        return;
      }

      const chat = await MessageService.getChatWithDetails(chatId);

      // Check if user is participant
      const isParticipant = chat.participants.some(
        (p) => (p._id?.toString() || p.toString()) === userId
      );
      if (!isParticipant) {
        ApiResponse.forbidden(res, 'Access denied');
        return;
      }

      ApiResponse.success(res, chat, 'Chat details retrieved successfully');
    } catch (error) {
      logger.error('Error in getChatDetails controller', {
        error,
        userId: req.user?.userId,
      });
      ApiResponse.error(res, 'Failed to retrieve chat details', 500);
    }
  }

  /**
   * Get messages in a chat
   */
  static async getChatMessages(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { chatId } = req.params;
      const { page, limit } = PaginationHelper.parseParams(req.query);

      if (!chatId) {
        ApiResponse.badRequest(res, 'Chat ID is required');
        return;
      }

      const result = await MessageService.getChatMessages(
        chatId,
        userId,
        page,
        limit
      );

      ApiResponse.success(res, result, 'Messages retrieved successfully');
    } catch (error) {
      logger.error('Error in getChatMessages controller', {
        error,
        userId: req.user?.userId,
      });
      ApiResponse.error(res, 'Failed to retrieve messages', 500);
    }
  }

  /**
   * Send message (HTTP endpoint as fallback)
   */
  static async sendMessage(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data: ISendMessageRequest = req.body;

      if (!data.chatId || !data.content || !data.messageType) {
        ApiResponse.badRequest(
          res,
          'Chat ID, content, and message type are required'
        );
        return;
      }

      const message = await MessageService.sendMessage(userId, data);

      // Notify via socket
      const socketService = getSocketService();
      const chat = await MessageService.getChatWithDetails(data.chatId);

      // Emit to socket users
      socketService
        .getSocketInstance()
        .to(`chat:${data.chatId}`)
        .emit('new-message', message);

      // Update chat for participants
      chat.participants.forEach((participant) => {
        socketService
          .getSocketInstance()
          .to(`user:${participant._id}`)
          .emit('chat-updated', chat);
      });

      ApiResponse.success(res, message, 'Message sent successfully', 201);
    } catch (error) {
      logger.error('Error in sendMessage controller', {
        error,
        userId: req.user?.userId,
      });
      ApiResponse.error(res, 'Failed to send message', 500);
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { chatId } = req.params;

      if (!chatId) {
        ApiResponse.badRequest(res, 'Chat ID is required');
        return;
      }

      const result = await MessageService.markMessagesAsRead(chatId, userId);

      // Notify via socket if messages were marked as read
      if (result.updatedCount > 0) {
        const socketService = getSocketService();
        socketService
          .getSocketInstance()
          .to(`chat:${chatId}`)
          .emit('message-read', {
            chatId,
            readBy: userId,
          });

        // Update chat for participants
        const chat = await MessageService.getChatWithDetails(chatId);
        chat.participants.forEach((participant) => {
          const participantId =
            participant._id?.toString() || participant.toString();
          socketService
            .getSocketInstance()
            .to(`user:${participantId}`)
            .emit('chat-updated', chat);
        });
      }

      ApiResponse.success(res, result, 'Messages marked as read');
    } catch (error) {
      logger.error('Error in markMessagesAsRead controller', {
        error,
        userId: req.user?.userId,
      });
      ApiResponse.error(res, 'Failed to mark messages as read', 500);
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { messageId } = req.params;

      if (!messageId) {
        ApiResponse.badRequest(res, 'Message ID is required');
        return;
      }

      await MessageService.deleteMessage(messageId, userId);

      ApiResponse.success(res, null, 'Message deleted successfully');
    } catch (error) {
      logger.error('Error in deleteMessage controller', {
        error,
        userId: req.user?.userId,
      });
      ApiResponse.error(res, 'Failed to delete message', 500);
    }
  }

  // Admin methods
  /**
   * Get all chats (admin only)
   */
  static async getAllChats(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { page, limit } = PaginationHelper.parseParams(req.query);

      const result = await MessageService.getAllChatsForAdmin(page, limit);

      ApiResponse.success(res, result, 'All chats retrieved successfully');
    } catch (error) {
      logger.error('Error in getAllChats controller', {
        error,
        userId: req.user?.userId,
      });
      ApiResponse.error(res, 'Failed to retrieve chats', 500);
    }
  }

  /**
   * Get chat messages (admin only)
   */
  static async getChatMessagesForAdmin(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { chatId } = req.params;
      const { page, limit } = PaginationHelper.parseParams(req.query);

      if (!chatId) {
        ApiResponse.badRequest(res, 'Chat ID is required');
        return;
      }

      const result = await MessageService.getChatMessagesForAdmin(
        chatId,
        page,
        limit
      );

      ApiResponse.success(res, result, 'Chat messages retrieved successfully');
    } catch (error) {
      logger.error('Error in getChatMessagesForAdmin controller', {
        error,
        userId: req.user?.userId,
      });
      ApiResponse.error(res, 'Failed to retrieve chat messages', 500);
    }
  }

  /**
   * Debug endpoint to check Socket.IO room status
   * Admin only
   */
  static async getSocketDebugInfo(
    req: IAuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const socketService = getSocketService();
      const io = socketService.getIO();

      // Get all rooms
      const rooms = Array.from(io.sockets.adapter.rooms.entries());

      // Filter out default socket rooms (socket IDs)
      const customRooms = rooms.filter(
        ([roomName]: [string, Set<string>]) =>
          roomName.startsWith('chat:') || roomName.startsWith('user:')
      );

      const roomInfo = [];

      for (const [roomName, socketIds] of customRooms) {
        const socketsInRoom = await io.in(roomName).fetchSockets();
        const userIds = socketsInRoom.map(
          (socket: any) => socket.data?.user?.userId || 'unknown'
        );

        roomInfo.push({
          roomName,
          socketCount: socketIds.size,
          socketIds: Array.from(socketIds),
          userIds,
        });
      }

      const totalConnections = io.sockets.sockets.size;

      ApiResponse.success(
        res,
        {
          totalConnections,
          totalRooms: customRooms.length,
          rooms: roomInfo,
          timestamp: new Date().toISOString(),
        },
        'Socket debug info retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in getSocketDebugInfo controller', {
        error,
        userId: req.user?.userId,
      });
      ApiResponse.error(res, 'Failed to retrieve socket debug info', 500);
    }
  }
}
